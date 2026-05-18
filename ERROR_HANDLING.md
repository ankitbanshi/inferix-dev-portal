# Error Handling Strategy

## Overview

Inferix Playground implements a comprehensive, graceful error handling strategy that ensures the application continues to function and provides useful feedback to users even when failures occur.

## Error Categories & Handling

### 1. Network Errors

#### Connection Failures
**Scenario**: Network is unavailable, DNS fails, or connection times out

**Detection**:
```typescript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  // ... request body
});

if (!response.ok) {
  const errorBody = await response.text();
  throw new Error(`API Error: ${response.status} - ${errorBody}`);
}
```

**Handling**:
1. Catch error in try/catch block
2. Store error message in state: `setError(error.message)`
3. Display clear error banner
4. Preserve partial output received before failure
5. Allow user to retry or clear and start fresh

**User Experience**:
```
┌─────────────────────────────────────────┐
│ ⚠️  Stream interrupted - partial output  │
│     preserved. Error: Network timeout    │
└─────────────────────────────────────────┘
[Previous tokens displayed here...]
[User can retry or clear]
```

#### Timeout Errors
**Scenario**: API takes too long to respond, stream stalls

**Detection**: Browser fetch timeout (default 30-60s)

**Handling**:
- Similar to connection failures
- API response monitoring for heartbeat
- Partial output preserved

**Prevention**:
```typescript
// Set reasonable timeout on requests
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

const response = await fetch('...', {
  signal: controller.signal
});
```

### 2. API Errors

#### 401 Unauthorized
**Scenario**: API key missing, expired, or invalid

**Detection**:
```typescript
if (response.status === 401) {
  throw new Error('Authentication failed: Invalid or missing API key');
}
```

**Handling**:
- Clear error message displayed
- Suggest checking environment configuration
- Log error with details for debugging

**User Message**:
```
Stream interrupted - partial output preserved. 
Error: Authentication failed: Invalid or missing API key
```

#### 429 Rate Limited
**Scenario**: Too many requests to API

**Detection**: HTTP 429 response

**Handling**:
1. Catch error and display rate limit message
2. Suggest waiting before retrying
3. Implement exponential backoff for automatic retries (future)

**User Message**:
```
Stream interrupted - partial output preserved. 
Error: API rate limit exceeded. Please wait before retrying.
```

#### 500+ Server Errors
**Scenario**: API server error or service down

**Detection**: 5xx HTTP status codes

**Handling**:
- Display generic error message (don't expose internal details)
- Suggest checking API status page
- Allow retry

**User Message**:
```
Stream interrupted - partial output preserved. 
Error: API server error. Please try again or check service status.
```

### 3. Stream Processing Errors

#### Malformed Response Data
**Scenario**: Invalid JSON in SSE stream, missing fields

**Detection**:
```typescript
for (let i = 0; i < lines.length - 1; i++) {
  const line = lines[i].trim();
  if (line.startsWith('data: ')) {
    const data = line.substring(6);
    if (data === '[DONE]') {
      return;
    }
    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices[0]?.delta?.content;
      if (delta) {
        onToken(delta);
      }
    } catch {
      // Ignore invalid chunk lines - common with streaming protocols
    }
  }
}
```

**Handling**:
- Try/catch silently ignores parse errors (common in SSE)
- Continues processing remaining valid chunks
- Only throws if completely unable to process response

**Impact**: Minimal - most malformed lines skipped gracefully

#### Null or Missing Response Body
**Scenario**: Response has no body for streaming

**Detection**:
```typescript
if (!response.body) {
  throw new Error('Response body is null');
}
```

**Handling**:
- Throw error immediately
- Bubble up to caller's try/catch
- Display to user as streaming failure

### 4. Audio Input Errors

#### Microphone Permission Denied
**Scenario**: User denies microphone access

**Detection**:
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  console.error('Error accessing microphone:', error);
  // setInputMode('text'); - fallback to text
}
```

**Handling**:
1. Catch error silently
2. Log error for debugging
3. Could fallback to text mode (current implementation)
4. Future: Show user-friendly prompt to enable permissions

**User Experience**:
- User clicks mic button
- Permission dialog appears
- If denied, mic button disabled or automatic fallback to text

#### Web Speech API Not Supported
**Scenario**: Browser doesn't support Web Speech API

**Detection**:
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.error('Speech Recognition API not supported');
  return;
}
```

**Handling**:
- Check for API existence before use
- Log error
- Audio button remains inactive
- User uses text input as fallback

**Browser Support**:
- Chrome/Edge: Full support ✓
- Safari: Full support ✓
- Firefox: Limited support (used Web Audio alternative)
- IE: No support (use text input)

#### Speech Recognition Errors
**Scenario**: Microphone hardware failure, background noise, speech not detected

**Detection**:
```typescript
recognition.onerror = (event: any) => {
  console.error('Speech recognition error', event.error);
  // Handle specific error types:
  // - 'network': Network error
  // - 'no-speech': No speech detected
  // - 'audio-capture': No microphone
  // - 'permission-denied': User denied permission
};
```

**Handling**:
- Log error type
- Allow user to retry
- Fallback to text input
- Future: Display specific error message

### 5. State Management Errors

#### Invalid State Transitions
**Scenario**: User action in unexpected state (e.g., compare while single streaming)

**Detection**: State guard conditions
```typescript
if (isComparing) {
  console.warn('Compare already in progress');
  return; // Prevent duplicate submissions
}
```

**Handling**:
- Guard against invalid state transitions
- Silently prevent action (no error shown)
- Maintain previous state
- Queue action for retry

#### Memory/Performance Issues
**Scenario**: Very large outputs cause memory pressure

**Detection**: Monitor output size
```typescript
if (outputA.length > MAX_OUTPUT_SIZE) {
  // Truncate or show warning
}
```

**Handling**:
- Optional truncation for very large outputs
- Lazy rendering of diff results
- Virtual scrolling for large diffs (future)

### 6. Input Validation Errors

#### Empty Prompt
**Scenario**: User submits without entering text

**Detection**:
```typescript
const currentInput = inputMode === 'audio' ? transcript : prompt;
if (!currentInput.trim()) {
  setError('Please enter a prompt');
  return;
}
```

**Handling**:
- Prevent submission
- Set error message
- Clear error after successful submission

#### Invalid Configuration
**Scenario**: Temperature or token values out of range

**Detection**:
```typescript
if (temperature < 0 || temperature > 1) {
  setError('Temperature must be between 0 and 1');
  return;
}
```

**Handling**:
- Validate before API call
- Display validation error
- Prevent submission until valid

### 7. Partial Output Recovery

**Philosophy**: Never lose data the user has seen

**Implementation**:
```typescript
try {
  await streamModel(/* ... */);
} catch (err) {
  // outputA still contains all tokens received before error
  // User can see partial result
  setError(err.message);
} finally {
  // Always clean up streaming state
  setIsStreamingSingle(false);
}
```

**Benefits**:
- User can review what was generated before failure
- Can copy partial output and retry
- Builds confidence that data isn't lost
- Reduces frustration on network failures

## Error Display UI

### Error Banner
```typescript
{error && (
  <div style={{ 
    backgroundColor: 'rgba(210, 153, 34, 0.2)',  // Warning color
    border: '1px solid rgba(210, 153, 34, 0.5)',
    color: '#d29922',
    fontSize: '14px',
    borderRadius: '6px',
    padding: '8px 16px',
    marginBottom: '12px'
  }}>
    Stream interrupted - partial output preserved. Error: {error}
  </div>
)}
```

**Features**:
- Warning color (#d29922) distinguishes from success/info
- Clear message structure: "[Action that happened] - [Outcome] - [Error]"
- Takes minimal space
- Dismissible by clearing or retrying
- Accessible (color + text)

## Error Recovery UI

### User Options After Error
1. **Retry**: Click submit button again to reattempt with same prompt
2. **Modify & Retry**: Edit prompt and submit
3. **Clear**: Delete output and start fresh
4. **View Code**: See API request for debugging

### Example Recovery Flow
```
[Error displayed]
    ↓
User reviews partial output
    ↓
Options:
  a) Retry immediately
  b) Modify prompt and retry
  c) Clear and start new
```

## Logging & Debugging

### Console Logging
```typescript
// Errors logged with context
console.error('Streaming failed:', error);
console.error('Speech recognition error', event.error);
console.error('Error accessing microphone:', error);

// Warnings for unusual conditions
console.warn('Compare already in progress');
```

### Error Details Shown to User
- Error message in banner
- Partial output visible
- "View Code" button shows exact API request

### Error Details NOT Shown (Security)
- Full stack traces
- Internal API paths
- Server-side debugging information
- User data from other sessions

## Prevention Strategies

### 1. Input Validation
- Validate prompt is not empty
- Validate temperature is 0-1
- Validate max tokens is within limits

### 2. Request Validation
- Verify API key exists before making request
- Check model name is valid
- Validate prompt length

### 3. State Guards
- Prevent duplicate submissions while streaming
- Prevent mixing single and compare mode operations
- Validate state transitions

### 4. Graceful Degradation
- Use optional chaining: `parsed.choices[0]?.delta?.content`
- Handle missing response fields
- Fallback to default values when reasonable

## Testing Error Scenarios

### Recommended Test Cases
1. Network disconnection during streaming
2. Invalid API key
3. Rate limit hit (429 response)
4. Malformed JSON in response
5. Microphone permission denied
6. Web Speech API not available
7. Very large prompt (edge case)
8. Empty prompt submission
9. Rapid retry clicks

### Simulating Errors (Dev Testing)
```typescript
// Mock network error
const streamModel = async () => {
  throw new Error('Network timeout');
};

// Mock API error
const response = { ok: false, status: 401 };

// Mock stream interruption
// Pause stream after N tokens
```

## Error Handling Best Practices Applied

✓ **Fail gracefully**: Show errors without crashing
✓ **Preserve state**: Keep partial data on failure
✓ **Provide feedback**: Clear error messages
✓ **Enable recovery**: Multiple ways to recover
✓ **Prevent cascades**: Validate before operations
✓ **Log efficiently**: Debug info without user confusion
✓ **User-friendly**: Non-technical language
✓ **Accessible**: Color + text, screen reader friendly
✓ **Consistent**: Similar errors handled similarly
✓ **Resilient**: Handle edge cases gracefully

## Future Enhancements

1. Automatic retry with exponential backoff
2. Error tracking/reporting to backend
3. Specific error codes with recovery links
4. Offline mode with local storage
5. Error analytics dashboard
6. Proactive health checks
7. Better speech recognition error messages
8. Streaming timeout adjustment UI

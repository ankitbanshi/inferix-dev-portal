# Inferix Playground - Architecture Documentation

## Project Overview

Inferix Playground is a React + TypeScript web application that enables enterprise engineers to test on-device inference through a browser-based playground with model comparison and visualization capabilities.

## Technology Stack

- **Frontend Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 8.0.13
- **API Integration**: Groq API (LLM streaming)
- **Speech Recognition**: Web Speech API (browser-native)
- **Styling**: Tailwind CSS 4.3 + custom CSS-in-JS
- **Markdown Rendering**: react-markdown 10.1
- **Deployment**: Vercel / Netlify

## Architecture Components

### 1. Core Components

#### PlayGround.tsx (Main Component)
- **Purpose**: Master component orchestrating the entire inference playground experience
- **Responsibilities**:
  - Input mode management (text/audio toggle)
  - Model selection and configuration
  - View mode switching (single/compare/compare-with-diff)
  - Streaming orchestration
  - Metrics collection and display
  - Error state management

#### Key Sub-Components
- **InputPanel**: Text input with mode toggle and keyboard shortcuts
- **MetricsBar**: Live token counting and tokens-per-second display
- **DiffPanel**: Side-by-side output comparison with token-level highlighting
- **AudioRecorder**: Audio input state and UI
- **ErrorBanner**: Error notification and recovery UI

### 2. Hooks

#### useAudioInput
- **Purpose**: Manage audio recording and speech-to-text transcription
- **Implementation**: Web Speech API integration
- **Capabilities**:
  - Real-time speech recognition
  - Interim/final transcript handling
  - Continuous recording with error handling

#### useMetrics
- **Purpose**: Track streaming performance metrics
- **Metrics Tracked**:
  - Token count (live and frozen)
  - Tokens-per-second (calculated during streaming)
  - Latency (start to completion time)

#### useStream
- **Purpose**: Handle ReadableStream parsing and token extraction
- **Implementation**: Groq API Server-Sent Events (SSE) parsing

### 3. Utilities

#### streamModel (Core Streaming Function)
- **Purpose**: Establish streaming connection to LLM API
- **Implementation**:
  - Uses Fetch API with streaming response handling
  - Implements ReadableStream for token-by-token delivery
  - Provides real-time token callback mechanism
  - Includes comprehensive error handling for network failures

#### diffWords (Diff Algorithm)
- **Purpose**: Generate token-level diff between two texts
- **Algorithm**: Longest Common Subsequence (LCS)
- **Features**:
  - Case-insensitive word matching
  - Stop-word filtering to reduce noise
  - Token type classification (added/removed/same)

#### stripMarkdown
- **Purpose**: Clean markdown formatting from model outputs
- **Cleaning Operations**:
  - Code block removal
  - Markdown syntax removal (emphasis, headers, etc.)
  - ASCII art filtering
  - Short fragment removal (1-3 character lines)

## Data Flow

### Single Mode Inference
```
User Input (Text/Audio) 
    ↓
[Fetch → Streaming API]
    ↓
Token Callback → Update State
    ↓
Render Output (markdown)
    ↓
Calculate & Display Metrics
```

### Compare Mode Inference
```
User Input (Text/Audio)
    ↓
Promise.all([
  Fetch Model A @ 0.3 temp (precise),
  Fetch Model B @ 0.9 temp (creative)
])
    ↓
Parallel Token Collection
    ↓
Auto-generate LCS Diff
    ↓
Render Side-by-Side Comparison
    ↓
Display Metrics & Diff Statistics
```

## State Management

### Main Component State
```typescript
// Input Management
inputMode: 'text' | 'audio'
prompt: string
temperature: number (0.0 - 1.0)
maxTokens: number

// Output State
outputA: string
outputB: string
diffTokens: DiffToken[]

// Streaming State
isStreamingSingle: boolean
isComparing: boolean

// Metrics
liveTokenCount: number
liveTokensPerSec: number
frozenTokenCount: number
frozenTokensPerSec: number
latencyMs: number

// UI State
viewMode: 'single' | 'compare' | 'compare-with-diff'
showMetrics: boolean
showFeedback: boolean
showViewCode: boolean
error: string | null
```

## API Integration

### Groq API Streaming
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Protocol**: HTTP/2 with Server-Sent Events (SSE)
- **Authentication**: Bearer token via environment variable
- **Models Used**:
  - Primary: `llama-3.3-70b-versatile` (configurable)
  - Compare A: `llama-3.3-70b-versatile` @ 0.3°C (precise)
  - Compare B: `llama-3.3-70b-versatile` @ 0.9°C (creative)

### Request Format
```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [{"role": "user", "content": "prompt"}],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1024
}
```

## Performance Optimization

### Metrics Freezing
- Live metrics update during streaming
- Metrics frozen immediately after stream completion
- Prevents UI re-renders from affecting displayed values
- Separate state variables for live vs frozen metrics

### Rendering Optimization
- Flex containers with `minHeight: 0` for proper nested scrolling
- Virtual scrolling for large diff output
- Debounced window resize handlers
- Memoized diff token rendering

### Bundle Optimization
- Tree-shaking unused dependencies
- CSS minification via Tailwind
- JavaScript compression via Vite
- Final bundle: ~362 KB (110.64 KB gzipped)

## Error Handling Strategy

### Network Errors
- Fetch timeout handling
- Graceful degradation with partial output preservation
- User-friendly error messages

### Stream Interruption
- Partial output preserved and displayed
- Clear error notification banner
- Ability to retry or clear and start fresh

### API Errors
- Non-200 status code detection
- Error body extraction and display
- Request validation before sending

### Client-Side Errors
- Input validation
- Audio permission denial handling
- Browser API support detection

## Accessibility Architecture

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for detailed accessibility implementation.

## Deployment Architecture

- **Build Process**: TypeScript compilation + Vite bundling
- **Deployment Target**: Vercel / Netlify
- **Environment Variables**: `VITE_GROQ_API_KEY`
- **Browser Support**: Modern browsers with ES2020+ support

## Future Enhancements

1. Model selection UI for custom model pairs
2. Prompt template library
3. Export/import conversation history
4. Advanced diff views (line-by-line, hunk-based)
5. Custom temperature/token presets
6. Multi-language support
7. Dark/light theme toggle
8. Performance profiling dashboard

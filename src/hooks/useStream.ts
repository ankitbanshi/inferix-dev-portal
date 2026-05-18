import { useState, useCallback } from 'react';

// Define the structure for the streaming state
interface StreamState {
  streaming: boolean;
  content: string;
  error: Error | null;
}

// Custom hook to handle streaming from the Groq API
export const useStream = (onTokenReceived?: () => void, temperature = 0.7, maxTokens = 1024) => {
  const [state, setState] = useState<StreamState>({
    streaming: false,
    content: '',
    error: null,
  });

  const startStream = useCallback(async (prompt: string) => {
    setState({ streaming: true, content: '', error: null });

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Response Error:', errorBody);
        throw new Error(`API Error: ${response.status} - ${errorBody}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];

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
                onTokenReceived?.();
                setState(prevState => ({ 
                  ...prevState, 
                  content: prevState.content + delta 
                }));
              }
            } catch (e) {
              // Silently ignore parsing errors
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().substring(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content;
            if (delta) {
              onTokenReceived?.();
              setState(prevState => ({ 
                ...prevState, 
                content: prevState.content + delta 
              }));
            }
          } catch (e) {
            // Silently ignore
          }
        }
      }

    } catch (error) {
      console.error('Streaming failed:', error, error instanceof Error ? error.message : '');
      if (error instanceof Error) {
        setState(prevState => ({ ...prevState, error, streaming: false }));
      } else {
        setState(prevState => ({ 
          ...prevState, 
          error: new Error('An unknown error occurred'),
          streaming: false 
        }));
      }
    } finally {
      setState(prevState => ({ ...prevState, streaming: false }));
    }
  }, []);

  return { ...state, startStream };
};

import { useState, useRef, useCallback } from 'react';

export function useMetrics() {
  const [tokenCount, setTokenCount] = useState(0);
  const [tokensPerSec, setTokensPerSec] = useState(0);
  const timestamps = useRef<number[]>([]);

  // Call this whenever a new token is received
  const onToken = useCallback(() => {
    const now = Date.now();
    timestamps.current.push(now);
    setTokenCount((c) => c + 1);
    // Only keep last 5 seconds for TPS
    const cutoff = now - 5000;
    timestamps.current = timestamps.current.filter((t) => t >= cutoff);
    setTokensPerSec(timestamps.current.length / 5);
  }, []);

  const reset = useCallback(() => {
    setTokenCount(0);
    setTokensPerSec(0);
    timestamps.current = [];
  }, []);

  return { tokenCount, tokensPerSec, onToken, reset };
}

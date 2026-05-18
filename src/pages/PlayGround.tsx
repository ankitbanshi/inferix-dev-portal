import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAudioInput } from '../hooks/useAudioInput';

type DiffToken = { word: string; type: 'same' | 'added' | 'removed' };
type ViewMode = 'single' | 'compare' | 'compare-with-diff';

const MODEL_DIFF_A = 'llama-3.3-70b-versatile';
const MODEL_DIFF_B = 'llama-3.3-70b-versatile';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off',
  'over', 'under', 'again', 'then', 'once', 'and', 'but', 'or',
  'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'no',
  'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'than',
]);

function stripMarkdown(text: string): string {
  return text
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/={3,}/g, '')
    .replace(/-{3,}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[^a-zA-Z0-9\s]{3,}.*$/gm, '')
    .replace(/^[\s\/\\\|\-\_\.\(\)\[\]\{\}\<\>\^]+$/gm, '')
    .replace(/^.{1,3}$/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function diffWords(a: string, b: string) {
  const wa = a.trim().split(/\s+/).filter(Boolean);
  const wb = b.trim().split(/\s+/).filter(Boolean);
  const m = wa.length, n = wb.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = wa[i - 1].toLowerCase() === wb[j - 1].toLowerCase()
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const result: { word: string, type: 'same' | 'added' | 'removed' }[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wa[i - 1].toLowerCase() === wb[j - 1].toLowerCase()) {
      result.unshift({ word: wa[i - 1], type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ word: wb[j - 1], type: 'added' });
      j--;
    } else {
      result.unshift({ word: wa[i - 1], type: 'removed' });
      i--;
    }
  }
  return result.map(token => ({
    ...token,
    type: STOP_WORDS.has(token.word.toLowerCase()) ? 'same' as const : token.type,
  }));
}

const ModelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5 0a.5.5 0 0 1 .5.5V2h5V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-5v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0" /></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2v2H2V2zm1 12v-2h2v2zm0-5v-2h2v2zm0-5v-2h2v2zm5 10v-2h2v2zm0-5v-2h2v2zm0-5v-2h2v2zM3 1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM3 6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zM3 11a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" /></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.58 5.48l-.386 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 2.303 4.22l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" /><path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm-9.022 1.025a.5.5 0 0 1 .498-.498h9.044a.5.5 0 0 1 .498.498l-.867 10.833A1 1 0 0 1 11.115 15H4.885a1 1 0 0 1-.995-1.134zM8 4.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M10.5 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M5.5 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0" /></svg>;

const InferencePlayground = () => {
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [currentModel] = useState('llama-3.3-70b-versatile');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [isStreamingSingle, setIsStreamingSingle] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [outputA, setOutputA] = useState('');
  const [outputB, setOutputB] = useState('');
  const [diffTokens, setDiffTokens] = useState<DiffToken[]>([]);
  const [latencyMs, setLatencyMs] = useState(0);
  const [tempDropdownOpen, setTempDropdownOpen] = useState(false);
  const [maxTokensDropdownOpen, setMaxTokensDropdownOpen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [showViewCode, setShowViewCode] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastPrompt, setLastPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [liveTokenCount, setLiveTokenCount] = useState(0);
  const [liveTokensPerSec, setLiveTokensPerSec] = useState(0);
  const [frozenTokenCount, setFrozenTokenCount] = useState(0);
  const [frozenTokensPerSec, setFrozenTokensPerSec] = useState(0);

  const { isRecording, transcript, startRecording, stopRecording } = useAudioInput();

  const mainContentRef = useRef<HTMLDivElement>(null);
  const diffSectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tempDropdownRef = useRef<HTMLDivElement>(null);
  const maxTokensDropdownRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<any>(null);

  const selectedTemperature = temperature;
  const selectedMaxTokens = maxTokens;

  const removedCount = diffTokens.filter(t => t.type === 'removed' && !STOP_WORDS.has(t.word.toLowerCase())).length;
  const addedCount = diffTokens.filter(t => t.type === 'added' && !STOP_WORDS.has(t.word.toLowerCase())).length;

  useEffect(() => {
    if (isRecording && inputMode === 'audio') {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording, inputMode]);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  }, [outputA, outputB, diffTokens]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tempDropdownRef.current && !tempDropdownRef.current.contains(e.target as Node)) {
        setTempDropdownOpen(false);
      }
      if (maxTokensDropdownRef.current && !maxTokensDropdownRef.current.contains(e.target as Node)) {
        setMaxTokensDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tempLabel = temperature === 0.7 ? 'Auto' : temperature === 1.0 ? 'Creative' : 'Precise';
  const maxTokensLabel = maxTokens === 1024 ? 'Default' : maxTokens === 256 ? 'Short' : 'Long';

  const markdownComponents = {
    p: ({ children }: any) => <p style={{ margin: '0 0 12px', lineHeight: '1.7', color: '#e6edf3' }}>{children}</p>,
    h1: ({ children }: any) => <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '16px 0 8px', color: '#e6edf3' }}>{children}</h1>,
    h2: ({ children }: any) => <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '14px 0 6px', color: '#e6edf3' }}>{children}</h2>,
    h3: ({ children }: any) => <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '12px 0 4px', color: '#e6edf3' }}>{children}</h3>,
    code: ({ inline, children }: any) => inline
      ? <code style={{ background: '#21262d', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', color: '#79c0ff', fontFamily: 'monospace' }}>{children}</code>
      : <pre style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px', overflowX: 'auto', margin: '12px 0' }}><code style={{ fontSize: '12px', color: '#e6edf3', fontFamily: 'monospace', whiteSpace: 'pre' }}>{children}</code></pre>,
    ul: ({ children }: any) => <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#e6edf3' }}>{children}</ul>,
    ol: ({ children }: any) => <ol style={{ margin: '8px 0', paddingLeft: '20px', color: '#e6edf3' }}>{children}</ol>,
    li: ({ children }: any) => <li style={{ margin: '4px 0', lineHeight: '1.6' }}>{children}</li>,
    strong: ({ children }: any) => <strong style={{ color: '#e6edf3', fontWeight: 600 }}>{children}</strong>,
    hr: () => <hr style={{ border: 'none', borderTop: '1px solid #30363d', margin: '16px 0' }} />,
  };

  const streamModel = async (
    runPrompt: string,
    model: string,
    runTemperature: number,
    runMaxTokens: number,
    onToken: (delta: string) => void,
  ) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: runPrompt }],
        stream: true,
        temperature: runTemperature,
        max_tokens: runMaxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
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
              onToken(delta);
            }
          } catch {
            // Ignore invalid chunk lines.
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().substring(6);
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices[0]?.delta?.content;
          if (delta) {
            onToken(delta);
          }
        } catch {
          // Ignore invalid chunk lines.
        }
      }
    }
  };

  const handleRun = async () => {
    const currentInput = prompt.trim();
    if (!currentInput) return;

    setLastPrompt(currentInput);
    setError(null);
    setLiveTokenCount(0);
    setLiveTokensPerSec(0);

    if (viewMode === 'single') {
      setOutputA('');
      setOutputB('');
      setDiffTokens([]);
      const startTime = Date.now();
      setLatencyMs(0);
      setIsStreamingSingle(true);
      let totalTokens = 0;

      try {
        await streamModel(currentInput, currentModel, selectedTemperature, selectedMaxTokens, (delta) => {
          setOutputA(prev => prev + delta);
          totalTokens++;
          setLiveTokenCount(totalTokens);
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            setLiveTokensPerSec(Math.round(totalTokens / elapsed));
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Streaming failed');
      } finally {
        setIsStreamingSingle(false);
        const endTime = Date.now() - startTime;
        setLatencyMs(endTime);
        setFrozenTokenCount(totalTokens);
        setFrozenTokensPerSec(totalTokens > 0 ? Math.round((totalTokens / (endTime / 1000))) : 0);
      }
      return;
    }

    setViewMode('compare');
    setOutputA('');
    setOutputB('');
    setDiffTokens([]);
    const compareStart = Date.now();
    setLatencyMs(0);
    setIsComparing(true);

    let finalOutputA = '';
    let finalOutputB = '';
    let totalTokens = 0;

    try {
      await Promise.all([
        streamModel(currentInput, MODEL_DIFF_A, 0.3, selectedMaxTokens, (delta) => {
          finalOutputA += delta;
          setOutputA(prev => prev + delta);
          totalTokens++;
          setLiveTokenCount(totalTokens);
          const elapsed = (Date.now() - compareStart) / 1000;
          if (elapsed > 0) {
            setLiveTokensPerSec(Math.round(totalTokens / elapsed));
          }
        }),
        streamModel(currentInput, MODEL_DIFF_B, 0.9, selectedMaxTokens, (delta) => {
          finalOutputB += delta;
          setOutputB(prev => prev + delta);
          totalTokens++;
          setLiveTokenCount(totalTokens);
          const elapsed = (Date.now() - compareStart) / 1000;
          if (elapsed > 0) {
            setLiveTokensPerSec(Math.round(totalTokens / elapsed));
          }
        }),
      ]);

      if (finalOutputA && finalOutputB) {
        const cleanA = stripMarkdown(finalOutputA);
        const cleanB = stripMarkdown(finalOutputB);
        setDiffTokens(diffWords(cleanA, cleanB));
        setViewMode('compare-with-diff');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
    } finally {
      setIsComparing(false);
      const endTime = Date.now() - compareStart;
      setLatencyMs(endTime);
      setFrozenTokenCount(totalTokens);
      setFrozenTokensPerSec(totalTokens > 0 ? Math.round((totalTokens / (endTime / 1000))) : 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRun();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleRecordingToggle = () => {
    if (inputMode === 'audio' && isRecording) {
      stopRecording();
      setPrompt(transcript);
      setInputMode('text');
    } else {
      setInputMode('audio');
      startRecording((text) => {
        setPrompt(text);
      });
    }
  };

  const handleClear = () => {
    setPrompt('');
    setOutputA('');
    setOutputB('');
    setDiffTokens([]);
    setFeedbackSent(false);
    setSelectedFeedback(null);
    setViewMode('single');
  };

  const renderOutput = (content: string, isStreaming: boolean) => {
    if (!content && !isStreaming) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'white' }}>Welcome to Inferix Playground</h1>
          <p style={{ color: '#8b949e', marginTop: '8px', fontSize: '14px' }}>Test on-device inference across model versions</p>
        </div>
      );
    }

    return (
      <div>
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        {isStreaming && (
          <span style={{ display: 'inline-block', width: '2px', height: '16px', background: '#2563eb', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
        )}
      </div>
    );
  };

  function generateCodeSnippet(): string {
    return `// Inferix - Generated API Call
// ${new Date().toISOString()}

const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_GROQ_API_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "${currentModel}",
      messages: [
        {
          role: "user",
          content: "${lastPrompt.replace(/"/g, '\\"')}"
        }
      ],
      stream: true,
      temperature: ${selectedTemperature},
      max_tokens: ${selectedMaxTokens},
    }),
  }
)

// Read the stream
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value)
  const lines = chunk.split("\\n")
    .filter(l => l.startsWith("data: "))
  for (const line of lines) {
    const data = line.replace("data: ", "")
    if (data === "[DONE]") break
    const json = JSON.parse(data)
    const token = json.choices[0]?.delta?.content || ""
    process.stdout.write(token)
  }
}`;
  }

  const renderCompareTopPanels = (showBadges: boolean) => (
    <div style={{ display: 'flex', flex: '0 0 65%', minHeight: 0, overflow: 'hidden', borderBottom: '1px solid #30363d' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '8px 16px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f85149', display: 'inline-block' }} />
          llama-3.3-70b - Precise (temp 0.3)
          {showBadges && (
            <span style={{ marginLeft: 'auto', background: 'rgba(248,81,73,0.15)', color: '#f85149', padding: '1px 8px', borderRadius: '10px', fontSize: '10px' }}>
              {removedCount} unique words
            </span>
          )}
        </div>
        <div className="output-panel" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 20px' }}>
          <ReactMarkdown components={markdownComponents}>{outputA}</ReactMarkdown>
          {isComparing && <span style={{ display: 'inline-block', width: '2px', height: '16px', background: '#2563eb', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />}
        </div>
      </div>

      <div style={{ width: '1px', background: '#30363d', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '8px 16px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950', display: 'inline-block' }} />
          llama-3.3-70b - Creative (temp 0.9)
          {showBadges && (
            <span style={{ marginLeft: 'auto', background: 'rgba(63,185,80,0.15)', color: '#3fb950', padding: '1px 8px', borderRadius: '10px', fontSize: '10px' }}>
              {addedCount} unique words
            </span>
          )}
        </div>
        <div className="output-panel" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 20px' }}>
          <ReactMarkdown components={markdownComponents}>{outputB}</ReactMarkdown>
          {isComparing && <span style={{ display: 'inline-block', width: '2px', height: '16px', background: '#2563eb', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#0d1117', color: '#e6edf3', overflow: 'hidden' }}>
      <nav role="navigation" aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', padding: '0 16px', backgroundColor: '#0d1117', borderBottom: '1px solid #30363d', flexShrink: 0, width: '100%' }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#e6edf3' }}>Inferix</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button aria-label="Model selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', cursor: 'pointer', fontSize: '14px' }}>
            <ModelIcon />
            <span>{currentModel}</span>
            <ChevronDownIcon />
          </button>
          <button
            aria-label={viewMode === 'single' ? 'Switch to compare mode' : 'Switch to single mode'}
            aria-pressed={viewMode !== 'single'}
            onClick={() => setViewMode(viewMode === 'single' ? 'compare' : 'single')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: viewMode !== 'single' ? '#1d6fa5' : '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', cursor: 'pointer', fontSize: '14px' }}
          >
            <GridIcon />
            <span>{viewMode === 'single' ? 'Compare' : 'Single'}</span>
          </button>
        </div>

        <div style={{ width: '120px' }} />
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px', flexShrink: 0, borderBottom: '1px solid #30363d' }}>
          <div style={{ position: 'relative' }} ref={tempDropdownRef}>
            <button
              aria-haspopup="listbox"
              aria-expanded={tempDropdownOpen}
              aria-label="Temperature setting"
              onClick={() => setTempDropdownOpen(!tempDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '12px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '9999px', color: '#e6edf3', cursor: 'pointer' }}
            >
              <StarIcon />
              <span>{tempLabel}</span>
              {temperature !== 0.7 && <span style={{ width: '6px', height: '6px', background: '#2563eb', borderRadius: '50%', display: 'inline-block', marginLeft: '4px' }} />}
              <ChevronDownIcon />
            </button>
            {tempDropdownOpen && (
              <ul role="listbox" aria-label="Temperature options" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', zIndex: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { label: 'Auto', value: 0.7 },
                  { label: 'Creative', value: 1.0 },
                  { label: 'Precise', value: 0.2 },
                ].map(opt => (
                  <li key={opt.value} role="option" aria-selected={temperature === opt.value}>
                    <button
                      onClick={() => {
                        setTemperature(opt.value);
                        setTempDropdownOpen(false);
                      }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', backgroundColor: temperature === opt.value ? '#1d6fa5' : 'transparent', color: '#e6edf3', border: 'none', cursor: 'pointer' }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ position: 'relative' }} ref={maxTokensDropdownRef}>
            <button
              aria-haspopup="listbox"
              aria-expanded={maxTokensDropdownOpen}
              aria-label="Max tokens setting"
              onClick={() => setMaxTokensDropdownOpen(!maxTokensDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '12px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '9999px', color: '#e6edf3', cursor: 'pointer' }}
            >
              <span>{maxTokensLabel}</span>
              {maxTokens !== 1024 && <span style={{ width: '6px', height: '6px', background: '#2563eb', borderRadius: '50%', display: 'inline-block', marginLeft: '4px' }} />}
              <ChevronDownIcon />
            </button>
            {maxTokensDropdownOpen && (
              <ul role="listbox" aria-label="Max tokens options" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '6px', zIndex: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { label: 'Short', value: 256 },
                  { label: 'Default', value: 1024 },
                  { label: 'Long', value: 4096 },
                ].map(opt => (
                  <li key={opt.value} role="option" aria-selected={maxTokens === opt.value}>
                    <button
                      onClick={() => {
                        setMaxTokens(opt.value);
                        setMaxTokensDropdownOpen(false);
                      }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', backgroundColor: maxTokens === opt.value ? '#1d6fa5' : 'transparent', color: '#e6edf3', border: 'none', cursor: 'pointer' }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div ref={mainContentRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, backgroundColor: '#0d1117' }} role="log" aria-live="polite" aria-label="Model output" aria-atomic="false">
          {viewMode === 'single' && <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '24px' }} className="output-panel">{renderOutput(outputA, isStreamingSingle)}</div>}

          {viewMode === 'compare' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }}>
              {renderCompareTopPanels(false)}
              <div style={{ flex: '0 0 35%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#8b949e', fontSize: '13px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid #30363d', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Generating outputs - diff will appear automatically...
              </div>
            </div>
          )}

          {viewMode === 'compare-with-diff' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }}>
              {renderCompareTopPanels(true)}

              <div ref={diffSectionRef} style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ padding: '8px 16px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '36px' }}>
                  <span>Word-level diff — auto generated</span>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#8b949e' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(248,81,73,0.5)' }} />
                      Removed from A
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#8b949e' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(63,185,80,0.5)' }} />
                      Added in B
                    </span>
                  </div>
                </div>

                <div className="output-panel" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 20px', lineHeight: '2.2', fontSize: '14px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                  {diffTokens.length === 0 ? (
                    <span style={{ color: '#8b949e', fontSize: '13px' }}>Calculating diff...</span>
                  ) : (
                    diffTokens.map((token, i) => (
                      <React.Fragment key={i}>
                        <span style={{ background: token.type === 'removed' ? 'rgba(248,81,73,0.15)' : token.type === 'added' ? 'rgba(63,185,80,0.15)' : 'transparent', color: token.type === 'removed' ? '#f85149' : token.type === 'added' ? '#3fb950' : '#e6edf3', textDecoration: token.type === 'removed' ? 'line-through' : 'none', borderRadius: '3px', padding: token.type !== 'same' ? '1px 4px' : '0', fontSize: '14px', lineHeight: '2.2' }}>
                          {token.word}
                        </span>
                        {' '}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {showMetrics && (
          <div style={{ margin: '0 24px 8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #30363d' }}>
              <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live Metrics
              </span>
              <button onClick={() => setShowMetrics(false)} aria-label="Close metrics panel" style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}>
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { label: 'TOKENS', value: frozenTokenCount.toString(), color: '#e6edf3' },
                { label: 'TOKENS / SEC', value: frozenTokensPerSec.toFixed(1), color: '#3fb950' },
                { label: 'LATENCY', value: latencyMs + 'ms', color: '#e6edf3' },
                { label: 'MODEL', value: currentModel, color: '#79c0ff' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px', borderRight: i < 3 ? '1px solid #30363d' : 'none' }}>
                  <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '6px', letterSpacing: '0.08em' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 600, color: m.color, fontFamily: 'monospace' }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFeedback && (
          <div style={{ margin: '0 24px 8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #30363d' }}>
              <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Rate this response
              </span>
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedbackSent(false);
                  setSelectedFeedback(null);
                }}
                aria-label="Close feedback panel"
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              {!feedbackSent ? (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[
                      { label: '👍 Helpful', value: 'helpful' },
                      { label: '👎 Not helpful', value: 'not-helpful' },
                      { label: '⚡ Too slow', value: 'slow' },
                      { label: '🎯 Inaccurate', value: 'inaccurate' },
                      { label: '✨ Excellent', value: 'excellent' },
                    ].map(item => (
                      <button
                        key={item.value}
                        onClick={() => setSelectedFeedback(item.value)}
                        style={{ background: selectedFeedback === item.value ? '#21262d' : 'transparent', border: selectedFeedback === item.value ? '1px solid #2563eb' : '1px solid #30363d', borderRadius: '6px', padding: '6px 14px', color: selectedFeedback === item.value ? '#e6edf3' : '#8b949e', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Additional comments (optional)..."
                    rows={2}
                    style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', color: '#e6edf3', fontSize: '12px', resize: 'none', marginBottom: '10px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={() => selectedFeedback && setFeedbackSent(true)}
                    disabled={!selectedFeedback}
                    style={{ background: selectedFeedback ? '#2563eb' : '#21262d', border: 'none', borderRadius: '6px', padding: '6px 16px', color: selectedFeedback ? '#fff' : '#484f58', fontSize: '12px', cursor: selectedFeedback ? 'pointer' : 'not-allowed', transition: 'all 0.15s ease' }}
                  >
                    Submit feedback
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3fb950', fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>✓</span>
                  Thanks for your feedback! It helps improve the models.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: '16px 24px', backgroundColor: 'transparent', flexShrink: 0, borderTop: '1px solid #30363d', overflow: 'auto' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(210, 153, 34, 0.2)', border: '1px solid rgba(210, 153, 34, 0.5)', color: '#d29922', fontSize: '14px', borderRadius: '6px', padding: '8px 16px', marginBottom: '12px' }}>
              Stream interrupted - partial output preserved. Error: {error}
            </div>
          )}

          <div style={{ width: '100%', height: '64px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '9999px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '0' }}>
            <button
              aria-label={inputMode === 'audio' ? 'Stop recording' : 'Start voice input'}
              aria-pressed={inputMode === 'audio'}
              onClick={handleRecordingToggle}
              style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', color: inputMode === 'audio' ? '#f85149' : '#8b949e', cursor: 'pointer', borderRadius: '50%' }}
            >
              <MicIcon />
            </button>
            <div style={{ flex: 1, padding: '0 16px', display: 'flex', alignItems: 'center', minHeight: '64px' }}>
              {inputMode === 'audio' && isRecording ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f85149', animation: 'pulse 1s ease-in-out infinite' }} />
                  <span style={{ color: '#8b949e', fontSize: '14px' }}>Recording...</span>
                  <span style={{ color: '#8b949e', fontSize: '12px' }}>{recordingTime}s</span>
                </div>
              ) : (
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your message... (Enter to run, Shift+Enter for new line)"
                  aria-label="Message input"
                  aria-describedby="input-hint"
                  style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#e6edf3', fontSize: '14px', resize: 'none', fontFamily: 'inherit', minHeight: '24px', maxHeight: '100px', padding: '8px 0', overflow: 'auto', lineHeight: '1.5' }}
                  disabled={isStreamingSingle || isComparing}
                  autoFocus
                  rows={1}
                />
              )}
            </div>
            <span id="input-hint" style={{ display: 'none' }}>Press Enter to run, Shift+Enter for new line</span>
            <button
              aria-label="Run inference (Enter or Ctrl+Enter)"
              onClick={handleRun}
              disabled={isStreamingSingle || isComparing || !prompt.trim()}
              style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '9999px', padding: '8px 24px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isStreamingSingle || isComparing || !prompt.trim() ? 0.5 : 1 }}
            >
              <span>Run</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#8b949e', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={handleClear} style={{ backgroundColor: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrashIcon />
                <span>Clear</span>
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  if (viewMode === 'compare-with-diff') {
                    setViewMode('compare-with-diff');
                    diffSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: viewMode === 'compare-with-diff' ? '#e6edf3' : '#484f58',
                  cursor: viewMode === 'compare-with-diff' ? 'pointer' : 'not-allowed',
                  pointerEvents: viewMode === 'compare-with-diff' ? 'auto' : 'none',
                }}
              >
                {viewMode === 'compare' && isComparing ? 'Generating...' : 'Diff View'}
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  setShowFeedback(!showFeedback);
                  setShowMetrics(false);
                }}
                style={{ backgroundColor: 'transparent', border: 'none', color: showFeedback ? '#e6edf3' : '#8b949e', cursor: 'pointer' }}
              >
                Feedback
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  setShowMetrics(!showMetrics);
                  setShowFeedback(false);
                }}
                style={{ backgroundColor: 'transparent', border: 'none', color: showMetrics ? '#e6edf3' : '#8b949e', cursor: 'pointer' }}
              >
                Metrics
              </button>
            </div>

            <div style={{ fontFamily: 'monospace' }}>
              {isStreamingSingle || isComparing ? (
                <span style={{ color: '#3fb950', fontSize: '11px' }}>● {liveTokenCount} tokens · {liveTokensPerSec} t/s</span>
              ) : (
                <span>{frozenTokenCount} tokens · {frozenTokensPerSec.toFixed(2)} t/s</span>
              )}
            </div>

            <button onClick={() => setShowViewCode(true)} style={{ backgroundColor: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CodeIcon />
              <span>View Code</span>
            </button>
          </div>
        </div>
      </div>

      {showViewCode && (
        <div
          onClick={() => setShowViewCode(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', width: '620px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>
                View Code
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCodeSnippet())}
                  style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', padding: '4px 12px', color: '#e6edf3', fontSize: '12px', cursor: 'pointer' }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowViewCode(false)}
                  aria-label="Close view code"
                  style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <pre style={{ margin: 0, padding: '20px', fontSize: '12px', lineHeight: '1.6', color: '#e6edf3', fontFamily: 'monospace', whiteSpace: 'pre', overflowX: 'auto' }}>
                {generateCodeSnippet()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InferencePlayground;

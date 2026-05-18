import { useRef, useState, useCallback } from 'react';

// Web Speech API type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useAudioInput = () => {
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const onTranscriptChangeRef = useRef<((text: string) => void) | null>(null);

  const startRecording = useCallback((onTranscriptChange?: (text: string) => void) => {
    try {
      // Use Web Speech API for transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('Speech Recognition API not supported');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.language = 'en-US';

      let interimTranscript = '';
      let finalTranscript = '';

      recognition.onstart = () => {
        setIsRecording(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentText = finalTranscript + interimTranscript;
        setTranscript(currentText);
        onTranscriptChangeRef.current?.(currentText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setTranscript(finalTranscript.trim());
        onTranscriptChangeRef.current?.(finalTranscript.trim());
      };

      recognitionRef.current = recognition;
      onTranscriptChangeRef.current = onTranscriptChange || null;
      recognition.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
  };
};

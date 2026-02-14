import { useState, useRef, useCallback, useEffect } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useSpeechToText(onFinalTranscript?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const accumulatedTranscriptRef = useRef('');

  // Keep the callback ref in sync (avoids stale closure issues)
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Check if Speech Recognition is supported
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognitionAPI;
    setIsSupported(supported);
    if (!supported) {
      setError('Speech Recognition not supported. Use Chrome or Edge.');
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech Recognition not supported. Use Chrome or Edge.');
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    setError(null);
    accumulatedTranscriptRef.current = '';

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;       // Keep listening until manually stopped
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[STT] Recognition started');
      setIsListening(true);
      setInterimTranscript('');
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalPart = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalPart += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalPart) {
        accumulatedTranscriptRef.current += finalPart;
        setTranscript(accumulatedTranscriptRef.current);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      console.log('[STT] Recognition ended');
      setIsListening(false);

      // Submit whatever we have accumulated when recognition ends
      const finalText = accumulatedTranscriptRef.current.trim();
      if (finalText && onFinalTranscriptRef.current) {
        console.log('[STT] Submitting transcript:', finalText);
        onFinalTranscriptRef.current(finalText);
      }
      accumulatedTranscriptRef.current = '';
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[STT] Speech recognition error:', event.error, event.message);
      setIsListening(false);

      // Map error types to user-friendly messages
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setError('Microphone permission denied. Click the lock icon in the address bar to allow mic access.');
          break;
        case 'no-speech':
          // This is normal — just means silence timeout; not a real error
          // Still submit any accumulated text
          {
            const accumulated = accumulatedTranscriptRef.current.trim();
            if (accumulated && onFinalTranscriptRef.current) {
              onFinalTranscriptRef.current(accumulated);
            }
          }
          break;
        case 'audio-capture':
          setError('No microphone found. Please connect a microphone.');
          break;
        case 'network':
          setError('Network error. Speech recognition requires an internet connection in Chrome.');
          break;
        case 'aborted':
          // User-initiated abort — not an error
          break;
        default:
          setError(`Speech error: ${event.error}`);
      }
      accumulatedTranscriptRef.current = '';
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      console.log('[STT] Starting recognition...');
    } catch (e) {
      console.error('[STT] Failed to start speech recognition:', e);
      setIsListening(false);
      setError('Failed to start speech recognition. Try clicking the mic button again.');
    }
  }, []);  // No deps — uses refs for callbacks

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop(); // stop() triggers onend which will submit accumulated text
      } catch { /* ignore */ }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
  };
}

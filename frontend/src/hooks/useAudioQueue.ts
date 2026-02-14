import { useRef, useCallback, useState } from 'react';

export function useAudioQueue() {
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playNext = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0) {
        setIsPlaying(false);
      }
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const base64Audio = audioQueueRef.current.shift()!;
    const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
    currentAudioRef.current = audio;

    audio.onended = () => {
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      playNext();
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      playNext();
    };

    audio.play().catch((err) => {
      console.log('Audio autoplay blocked:', err);
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      setIsPlaying(false);
      playNext();
    });
  }, []);

  const queueAudio = useCallback((base64Audio: string) => {
    audioQueueRef.current.push(base64Audio);
    playNext();
  }, [playNext]);

  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  return {
    queueAudio,
    clearQueue,
    isPlaying,
  };
}

// Simple beep sound effect using Web Audio API
export function playBeep(frequency = 800, duration = 100) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = frequency;
    osc.type = 'sine';

    gain.gain.value = 0.1; // Low volume

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, duration);
  } catch (e) {
    // Audio context not available
  }
}

// Success chime
export function playSuccessChime() {
  playBeep(523, 100); // C5
  setTimeout(() => playBeep(659, 100), 100); // E5
  setTimeout(() => playBeep(784, 150), 200); // G5
}

// Warning buzz
export function playWarningBuzz() {
  playBeep(200, 200);
}

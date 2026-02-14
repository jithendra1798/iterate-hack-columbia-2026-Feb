import { useState, useEffect, useCallback, useRef } from 'react';
import TimerBar from '@/components/TimerBar';
import BriefingScreen from '@/components/BriefingScreen';
import ChallengeScreen from '@/components/ChallengeScreen';
import ScoreScreen from '@/components/ScoreScreen';
import type { HeistScreen, AgentMessage, Choice } from '@/types/heist';
import { startGame, submitAction, getGameState, connectGameWS } from '@/services/gameApi';
import { useAudioQueue, playWarningBuzz, playSuccessChime } from '@/hooks/useAudioQueue';

const TOTAL_TIME = 300;

// Convert phase string to puzzle index
const phaseToIndex = (phase: string): number => {
  switch (phase) {
    case 'CHALLENGE_1': return 0;
    case 'CHALLENGE_2': return 1;
    case 'CHALLENGE_3': return 2;
    default: return 0;
  }
};

// Map backend options to frontend choices
const mapOptionsToChoices = (options: Array<{id: string; label: string; desc?: string; description?: string}>): Choice[] => {
  return options.map(opt => ({
    id: opt.id,
    label: opt.label,
    description: opt.desc || opt.description,
  }));
};

const Index = () => {
  const [screen, setScreen] = useState<HeistScreen>('briefing');
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [challengePhase, setChallengePhase] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('BRIEFING');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const hasPlayedWarningRef = useRef(false);

  // Audio queue for CIPHER's voice
  const { queueAudio, isPlaying: isCipherSpeaking, clearQueue } = useAudioQueue();

  // Timer — polls server state when active
  useEffect(() => {
    if (!timerActive || !gameId) return;

    const interval = setInterval(async () => {
      try {
        const state = await getGameState(gameId);
        setTimeRemaining(state.time_remaining);
        // Convert phase string to puzzle index (0, 1, 2)
        setCurrentPhase(state.phase as unknown as string);
        setChallengePhase(phaseToIndex(state.phase as unknown as string));
        // Extract choice labels from objects
        if (Array.isArray(state.choices_made)) {
          const labels = state.choices_made.map((c: unknown) =>
            typeof c === 'string' ? c : (c as Record<string, unknown>)?.choice as string || ''
          ).filter(Boolean);
          setChoicesMade(labels);
        }

        if (state.time_remaining <= 0) {
          setTimerActive(false);
          setScreen('score');
        }
      } catch {
        // Fallback: decrement locally if server unreachable
        setTimeRemaining((t) => {
          if (t <= 1) {
            setTimerActive(false);
            setScreen('score');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, gameId]);

  // WebSocket message handler
  const handleWSMessage = useCallback((data: Record<string, unknown>) => {
    const msgType = data.type as string;

    // Handle different message types from server
    if (msgType === 'cipher_message') {
      const text = data.text as string;
      const phase = data.phase as string;

      setMessages((prev) => [
        ...prev,
        {
          id: `ws-${Date.now()}`,
          sender: 'CIPHER',
          text: text,
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);

      // Update phase
      if (phase) {
        setCurrentPhase(phase);
        setChallengePhase(phaseToIndex(phase));
      }

      // Queue audio for playback (instead of playing directly)
      if (data.audio_base64) {
        queueAudio(data.audio_base64 as string);
      }
    }

    if (msgType === 'tool_call') {
      // Show tool call as a message
      const toolName = data.tool as string;
      setMessages((prev) => [
        ...prev,
        {
          id: `tool-${Date.now()}`,
          sender: 'CIPHER',
          text: `[HACKING... ${toolName}]`,
          timestamp: Date.now(),
        },
      ]);
    }

    if (msgType === 'phase_change') {
      const newPhase = data.new_phase as string;
      const challengeData = data.challenge_data as Record<string, unknown>;

      setCurrentPhase(newPhase);
      setChallengePhase(phaseToIndex(newPhase));

      // Extract choices from challenge_data.options
      if (challengeData?.options && Array.isArray(challengeData.options)) {
        setChoices(mapOptionsToChoices(challengeData.options as Array<{id: string; label: string; desc?: string}>));
      } else if (challengeData?.routes && Array.isArray(challengeData.routes)) {
        // Challenge 3 has routes instead of options
        setChoices(mapOptionsToChoices((challengeData.routes as Array<{id: string; label: string; desc?: string}>)));
      }
    }

    if (msgType === 'timer_update') {
      const newTime = data.time_remaining as number;
      setTimeRemaining(newTime);

      // Play warning buzz when timer goes under 60 seconds (once)
      if (newTime === 59 && !hasPlayedWarningRef.current) {
        hasPlayedWarningRef.current = true;
        playWarningBuzz();
      }
    }

    if (msgType === 'game_over') {
      setTimerActive(false);
      const score = data.score as Record<string, unknown>;
      setFinalScore(score);
      setScreen('score');

      // Play success chime if good score
      if (score?.total_score && (score.total_score as number) >= 75) {
        playSuccessChime();
      }
    }

    if (msgType === 'error') {
      console.error('Server error:', data.message);
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'CIPHER',
          text: `⚠ ${data.message}`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [queueAudio]);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleProceed = useCallback(async () => {
    try {
      const res = await startGame();
      setGameId(res.game_id);
      setScreen('challenge');
      setTimerActive(true);
      setCurrentPhase('BRIEFING');

      // Seed first CIPHER message
      setMessages([
        {
          id: `init-${Date.now()}`,
          sender: 'CIPHER',
          text: res.cipher_message,
          timestamp: Date.now(),
        },
      ]);

      // Extract initial choices from challenge_data.options if present
      const challengeData = res.challenge_data as Record<string, unknown>;
      if (challengeData?.options && Array.isArray(challengeData.options)) {
        setChoices(mapOptionsToChoices(challengeData.options as Array<{id: string; label: string; desc?: string}>));
      }

      // Open WebSocket for real-time updates
      wsRef.current?.close();
      wsRef.current = connectGameWS(res.game_id, handleWSMessage, () => {
        console.log('[Game] WS disconnected');
      });
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  }, [handleWSMessage]);

  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (!gameId || isLoading) return;

      const chosenLabel = choices.find((c) => c.id === choiceId)?.label || choiceId;
      setChoicesMade((prev) => [...prev, chosenLabel]);
      setIsLoading(true);

      // Show player message immediately
      setMessages((prev) => [
        ...prev,
        { id: `p-${Date.now()}`, sender: 'YOU', text: chosenLabel, timestamp: Date.now() },
      ]);
      setChoices([]); // Clear while waiting for server

      try {
        const res = await submitAction(gameId, chosenLabel);

        // Add CIPHER response
        setMessages((prev) => [
          ...prev,
          {
            id: `r-${Date.now()}`,
            sender: 'CIPHER',
            text: res.cipher_message,
            timestamp: Date.now(),
          },
        ]);
        setIsLoading(false);

        // Update phase
        setCurrentPhase(res.phase);
        setChallengePhase(phaseToIndex(res.phase));

        // Update choices from response - check options OR routes
        const challengeData = res.challenge_data as Record<string, unknown>;
        if (challengeData?.options && Array.isArray(challengeData.options)) {
          setChoices(mapOptionsToChoices(challengeData.options as Array<{id: string; label: string; desc?: string}>));
        } else if (challengeData?.routes && Array.isArray(challengeData.routes)) {
          setChoices(mapOptionsToChoices(challengeData.routes as Array<{id: string; label: string; desc?: string}>));
        }

        // Queue audio for playback
        if (res.audio_base64) {
          queueAudio(res.audio_base64);
        }

        // Check if game ended (DEBRIEF phase)
        if (res.phase === 'DEBRIEF') {
          setTimerActive(false);
          setFinalScore(challengeData as Record<string, unknown>);
          setScreen('score');
          if (challengeData?.total_score && (challengeData.total_score as number) >= 75) {
            playSuccessChime();
          }
        }
      } catch (err) {
        console.error('Action failed:', err);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'CIPHER',
            text: '⚠ CONNECTION UNSTABLE — retrying...',
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [gameId, choices, isLoading, queueAudio],
  );

  const handleTextSubmit = useCallback(
    async (text: string) => {
      if (!gameId || isLoading) return;

      setChoicesMade((prev) => [...prev, text]);
      setIsLoading(true);

      // Show player message immediately
      setMessages((prev) => [
        ...prev,
        { id: `p-${Date.now()}`, sender: 'YOU', text: text, timestamp: Date.now() },
      ]);

      try {
        const res = await submitAction(gameId, text);

        // Add CIPHER response
        setMessages((prev) => [
          ...prev,
          {
            id: `r-${Date.now()}`,
            sender: 'CIPHER',
            text: res.cipher_message,
            timestamp: Date.now(),
          },
        ]);
        setIsLoading(false);

        // Update phase
        setCurrentPhase(res.phase);
        setChallengePhase(phaseToIndex(res.phase));

        // Update choices from response
        const challengeData = res.challenge_data as Record<string, unknown>;
        if (challengeData?.options && Array.isArray(challengeData.options)) {
          setChoices(mapOptionsToChoices(challengeData.options as Array<{id: string; label: string; desc?: string}>));
        } else if (challengeData?.routes && Array.isArray(challengeData.routes)) {
          setChoices(mapOptionsToChoices(challengeData.routes as Array<{id: string; label: string; desc?: string}>));
        } else {
          setChoices([]);
        }

        // Queue audio for playback
        if (res.audio_base64) {
          queueAudio(res.audio_base64);
        }

        // Check if game ended
        if (res.phase === 'DEBRIEF') {
          setTimerActive(false);
          setFinalScore(challengeData as Record<string, unknown>);
          setScreen('score');
          if (challengeData?.total_score && (challengeData.total_score as number) >= 75) {
            playSuccessChime();
          }
        }
      } catch (err) {
        console.error('Action failed:', err);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'CIPHER',
            text: '⚠ CONNECTION UNSTABLE — retrying...',
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [gameId, isLoading, queueAudio],
  );

  const handleRestart = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    clearQueue();
    setGameId(null);
    setScreen('briefing');
    setTimeRemaining(TOTAL_TIME);
    setTimerActive(false);
    setChallengePhase(0);
    setCurrentPhase('BRIEFING');
    setMessages([]);
    setChoices([]);
    setChoicesMade([]);
    setFinalScore(null);
    setIsLoading(false);
    hasPlayedWarningRef.current = false;
  }, [clearQueue]);

  const timeTaken = TOTAL_TIME - timeRemaining;
  const partnershipRating = Math.max(
    20,
    Math.min(100, 100 - timeTaken * 0.2 + choicesMade.length * 10),
  );

  return (
    <div className="min-h-screen bg-background relative">
      <TimerBar timeRemaining={timeRemaining} totalTime={TOTAL_TIME} />

      {screen === 'briefing' && <BriefingScreen onProceed={handleProceed} />}
      {screen === 'challenge' && (
        <ChallengeScreen
          messages={messages}
          choices={choices}
          onChoice={handleChoice}
          challengePhase={challengePhase}
          onTextSubmit={handleTextSubmit}
          isLoading={isLoading}
          isCipherSpeaking={isCipherSpeaking}
          onStopCipherAudio={clearQueue}
        />
      )}
      {screen === 'score' && (
        <ScoreScreen
          timeTaken={timeTaken}
          choicesMade={choicesMade}
          partnershipRating={partnershipRating}
          onRestart={handleRestart}
          serverScore={finalScore}
        />
      )}
    </div>
  );
};

export default Index;

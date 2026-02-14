import { useState, useEffect, useCallback, useRef } from 'react';
import TimerBar from '@/components/TimerBar';
import BriefingScreen from '@/components/BriefingScreen';
import ChallengeScreen from '@/components/ChallengeScreen';
import ScoreScreen from '@/components/ScoreScreen';
import type { HeistScreen, AgentMessage, Choice } from '@/types/heist';
import { startGame, submitAction, getGameState, connectGameWS } from '@/services/gameApi';

const TOTAL_TIME = 300;

const Index = () => {
  const [screen, setScreen] = useState<HeistScreen>('briefing');
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [challengePhase, setChallengePhase] = useState(0);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Timer — polls server state when active
  useEffect(() => {
    if (!timerActive || !gameId) return;

    const interval = setInterval(async () => {
      try {
        const state = await getGameState(gameId);
        setTimeRemaining(state.time_remaining);
        setChallengePhase(state.phase);
        setChoicesMade(state.choices_made);

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
    // Server pushes: cipher_message, choices, phase transitions, etc.
    if (data.cipher_message) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ws-${Date.now()}`,
          sender: 'CIPHER',
          text: data.cipher_message as string,
          timestamp: Date.now(),
        },
      ]);
    }

    if (data.choices && Array.isArray(data.choices)) {
      setChoices(
        (data.choices as Array<{ id: string; label: string; description?: string }>).map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
        })),
      );
    }

    if (typeof data.phase === 'number') {
      setChallengePhase(data.phase as number);
    }

    if (data.game_over === true) {
      setTimerActive(false);
      setScreen('score');
    }
  }, []);

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

      // Seed first CIPHER message
      setMessages([
        {
          id: `init-${Date.now()}`,
          sender: 'CIPHER',
          text: res.cipher_message,
          timestamp: Date.now(),
        },
      ]);

      // Extract initial choices from challenge_data if present
      if (res.challenge_data && Array.isArray((res.challenge_data as any).choices)) {
        setChoices(
          (res.challenge_data as any).choices.map((c: any) => ({
            id: c.id,
            label: c.label,
            description: c.description,
          })),
        );
      }

      // Open WebSocket
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
      if (!gameId) return;

      const chosenLabel = choices.find((c) => c.id === choiceId)?.label || choiceId;
      setChoicesMade((prev) => [...prev, chosenLabel]);

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

        setChallengePhase(res.phase);

        // Update choices from response
        if (res.challenge_data && Array.isArray((res.challenge_data as any).choices)) {
          setChoices(
            (res.challenge_data as any).choices.map((c: any) => ({
              id: c.id,
              label: c.label,
              description: c.description,
            })),
          );
        }

        // Check if game ended
        if ((res.game_state as any)?.completed) {
          setTimerActive(false);
          setScreen('score');
        }
      } catch (err) {
        console.error('Action failed:', err);
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
    [gameId, choices],
  );

  const handleRestart = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setGameId(null);
    setScreen('briefing');
    setTimeRemaining(TOTAL_TIME);
    setTimerActive(false);
    setChallengePhase(0);
    setMessages([]);
    setChoices([]);
    setChoicesMade([]);
  }, []);

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
        />
      )}
      {screen === 'score' && (
        <ScoreScreen
          timeTaken={timeTaken}
          choicesMade={choicesMade}
          partnershipRating={partnershipRating}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default Index;

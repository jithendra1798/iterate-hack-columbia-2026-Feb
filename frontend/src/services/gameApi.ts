const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

// ── REST ──

export interface StartGameResponse {
  game_id: string;
  cipher_message: string;
  game_state: Record<string, unknown>;
  challenge_data: Record<string, unknown>;
}

export interface ActionResponse {
  cipher_message: string;
  tool_calls: unknown[];
  game_state: Record<string, unknown>;
  phase: number;
  challenge_data: Record<string, unknown>;
}

export interface GameStateResponse {
  phase: number;
  score: number;
  time_remaining: number;
  choices_made: string[];
  penalties: number;
}

export async function startGame(): Promise<StartGameResponse> {
  const res = await fetch(`${API_BASE}/api/game/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Start game failed: ${res.status}`);
  return res.json();
}

export async function submitAction(gameId: string, input: string): Promise<ActionResponse> {
  const res = await fetch(`${API_BASE}/api/game/${gameId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`Action failed: ${res.status}`);
  return res.json();
}

export async function getGameState(gameId: string): Promise<GameStateResponse> {
  const res = await fetch(`${API_BASE}/api/game/${gameId}/state`);
  if (!res.ok) throw new Error(`Get state failed: ${res.status}`);
  return res.json();
}

export async function getChallengeData(challengeId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/challenge/${challengeId}`);
  if (!res.ok) throw new Error(`Get challenge failed: ${res.status}`);
  return res.json();
}

// ── WebSocket ──

export type WSMessageHandler = (data: Record<string, unknown>) => void;

export function connectGameWS(
  gameId: string,
  onMessage: WSMessageHandler,
  onClose?: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/game/${gameId}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      console.error('[WS] Failed to parse message:', event.data);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Connection closed');
    onClose?.();
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
  };

  return ws;
}

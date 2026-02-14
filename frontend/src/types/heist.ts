export type HeistScreen = 'briefing' | 'challenge' | 'score';

export interface AgentMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
}

export interface HeistState {
  screen: HeistScreen;
  timeRemaining: number;
  totalTime: number;
  messages: AgentMessage[];
  choices: Choice[];
  choicesMade: string[];
  startTime: number;
  partnershipRating: number;
}

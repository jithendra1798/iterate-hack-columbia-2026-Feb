import { useState, useRef, useEffect, useCallback } from 'react';
import type { AgentMessage, Choice } from '@/types/heist';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface ChallengeScreenProps {
  messages: AgentMessage[];
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  challengePhase: number;
  onTextSubmit?: (text: string) => void;
  isLoading?: boolean;
  isCipherSpeaking?: boolean;
}

const ServerLogsPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">▸ SERVER LOGS — LAYER 1</div>
    <pre className="text-xs text-muted-foreground leading-relaxed overflow-auto max-h-[400px]">
{`[2024-03-15 02:14:33] AUTH ATTEMPT — user:admin — FAILED
[2024-03-15 02:14:34] AUTH ATTEMPT — user:admin — FAILED
[2024-03-15 02:14:35] AUTH ATTEMPT — user:root  — FAILED
[2024-03-15 02:14:41] FIREWALL RULE 7732 — TRIGGERED
[2024-03-15 02:14:42] PORT SCAN DETECTED — 192.168.1.███
[2024-03-15 02:14:45] AUTH ATTEMPT — user:svc_backup — SUCCESS
[2024-03-15 02:14:46] SESSION TOKEN: a3f8...c291
[2024-03-15 02:14:47] PRIVILEGE ESCALATION — svc_backup → root
[2024-03-15 02:14:48] ▓▓▓ ANOMALY DETECTED ▓▓▓
[2024-03-15 02:14:49] DOWNLOADING: /vault/keys/master.pem
[2024-03-15 02:14:50] TRANSFER RATE: 12.4 MB/s
[2024-03-15 02:14:52] INTRUSION COUNTERMEASURE ARMED
[2024-03-15 02:14:55] ████ TRACE INITIATED ████`}
    </pre>
    <div className="mt-3 text-neon-amber text-xs animate-pulse-glow">
      ⚠ ANALYZE LOGS TO IDENTIFY ENTRY VECTOR
    </div>
  </div>
);

const CipherPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">▸ CIPHER TEXT — LAYER 2</div>
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-sm font-mono text-primary text-sm tracking-wider text-center">
        <div>58 47 56 73 62 47 38 67</div>
        <div>56 32 39 79 62 47 51 3d</div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {['ROT13', 'BASE64', 'HEX→ASCII', 'CAESAR-7', 'XOR-0x42', 'VIGENÈRE', 'AES-128', 'ATBASH'].map(cipher => (
          <div key={cipher} className="border border-border p-2 text-center text-muted-foreground hover:border-secondary hover:text-secondary transition-colors cursor-pointer">
            {cipher}
          </div>
        ))}
      </div>
    </div>
    <div className="mt-3 text-neon-amber text-xs animate-pulse-glow">
      ⚠ DECODE THE INTERCEPTED TRANSMISSION
    </div>
  </div>
);

const MapPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">▸ EXTRACTION MAP — LAYER 3</div>
    <pre className="text-xs text-primary leading-tight">
{`     N
     ▲
  ┌──┼──────────────────┐
  │  │    ╔═══╗         │
  │  │    ║ V ║  VAULT  │
  │  │    ╚═╦═╝         │
  │  │      ║           │
W ◄──┼──────╬───────► E │
  │  │   ┌──╨──┐        │
  │  │   │ELEV │        │
  │  │   └──┬──┘        │
  │  │      │    ┌───┐  │
  │  │      └────┤ X ├──│── EXIT
  │  │           └───┘  │
  └──┼──────────────────┘
     ▼
     S

  V = VAULT    X = EXTRACTION
  ── = CORRIDOR
  ═══ = SECURED PASSAGE`}
    </pre>
    <div className="mt-3 text-neon-amber text-xs animate-pulse-glow">
      ⚠ PLAN YOUR EXTRACTION ROUTE
    </div>
  </div>
);

const puzzles = [ServerLogsPuzzle, CipherPuzzle, MapPuzzle];

const ChallengeScreen = ({ messages, choices, onChoice, challengePhase, onTextSubmit, isLoading = false, isCipherSpeaking = false }: ChallengeScreenProps) => {
  const [textInput, setTextInput] = useState('');
  const PuzzleComponent = puzzles[challengePhase] || ServerLogsPuzzle;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech-to-text hook - auto-submit when speech is finalized
  const handleSpeechResult = useCallback((text: string) => {
    if (onTextSubmit && text.trim()) {
      onTextSubmit(text.trim());
    }
  }, [onTextSubmit]);

  const { isListening, interimTranscript, isSupported, startListening, stopListening } = useSpeechToText(handleSpeechResult);

  // Determine if input should be disabled
  const inputDisabled = isLoading || isCipherSpeaking;
  const micDisabled = inputDisabled || !isSupported;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Spacebar push-to-talk shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if spacebar pressed and not in an input field
      if (e.code === 'Space' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA' &&
          !micDisabled && !isListening) {
        e.preventDefault();
        startListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isListening) {
        e.preventDefault();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening, micDisabled, startListening, stopListening]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && onTextSubmit && !inputDisabled) {
      onTextSubmit(textInput.trim());
      setTextInput('');
    }
  };

  const handleMicClick = () => {
    if (micDisabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen pt-14 px-4 pb-4 scanlines">
      <div className="grid md:grid-cols-2 gap-4 h-[calc(100vh-4.5rem)]">
        {/* Left: Terminal */}
        <div className="border border-border border-glow-green bg-card rounded-sm flex flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="w-2 h-2 rounded-full bg-neon-amber" />
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground text-xs ml-2">CIPHER_TERMINAL — secure channel</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className={`text-xs ${msg.sender === 'CIPHER' ? 'text-secondary text-glow-cyan' : 'text-primary text-glow-green'}`}>
                  [{msg.sender}]
                </span>
                <span className="text-foreground ml-2 whitespace-pre-wrap">{msg.text}</span>
              </div>
            ))}
            <span className="terminal-cursor text-primary">█</span>
            <div ref={messagesEndRef} />
          </div>

          {/* Choices - show buttons if available */}
          {choices.length > 0 && (
            <div className="border-t border-border p-4 space-y-2">
              <div className="text-xs text-muted-foreground mb-2">▸ SELECT ACTION:</div>
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onChoice(choice.id)}
                  className="w-full text-left border border-border px-4 py-2 text-sm text-primary
                             hover:border-primary hover:bg-primary/10 transition-all duration-200
                             hover:text-glow-green"
                >
                  {'>'} {choice.label}
                  {choice.description && (
                    <span className="text-muted-foreground text-xs ml-2">— {choice.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Text input - always show for typing responses */}
          <form onSubmit={handleTextSubmit} className="border-t border-border p-4">
            {/* Status indicator */}
            {(isListening || isCipherSpeaking || isLoading) && (
              <div className="mb-2 text-xs">
                {isCipherSpeaking && (
                  <span className="text-secondary animate-pulse">▸ CIPHER is speaking...</span>
                )}
                {isListening && !isCipherSpeaking && (
                  <span className="text-destructive animate-pulse">▸ Listening... (release SPACE to send)</span>
                )}
                {isLoading && !isCipherSpeaking && !isListening && (
                  <span className="text-neon-amber animate-pulse">▸ Processing...</span>
                )}
              </div>
            )}

            {/* Show interim transcript while listening */}
            {isListening && interimTranscript && (
              <div className="mb-2 text-sm text-muted-foreground italic">
                "{interimTranscript}"
              </div>
            )}

            <div className="flex gap-2">
              {/* Mic button */}
              {isSupported && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={micDisabled}
                  className={`border px-3 py-2 text-sm transition-all ${
                    isListening
                      ? 'border-destructive bg-destructive/20 text-destructive animate-pulse'
                      : micDisabled
                      ? 'border-muted-foreground/50 text-muted-foreground/50 cursor-not-allowed'
                      : 'border-secondary text-secondary hover:bg-secondary/10'
                  }`}
                  title={micDisabled ? (isCipherSpeaking ? 'CIPHER is speaking' : 'Processing...') : 'Hold SPACE or click to speak'}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>
              )}

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={inputDisabled ? (isCipherSpeaking ? 'CIPHER is speaking...' : 'Processing...') : 'Type your response or hold SPACE to speak...'}
                disabled={inputDisabled}
                className={`flex-1 bg-muted border border-border px-4 py-2 text-sm text-primary
                           focus:border-primary focus:outline-none placeholder:text-muted-foreground
                           ${inputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <button
                type="submit"
                disabled={inputDisabled || !textInput.trim()}
                className={`border border-primary text-primary px-4 py-2 text-sm
                           transition-all ${inputDisabled || !textInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'}`}
              >
                SEND
              </button>
            </div>
          </form>
        </div>

        {/* Right: Puzzle */}
        <PuzzleComponent />
      </div>
    </div>
  );
};

export default ChallengeScreen;

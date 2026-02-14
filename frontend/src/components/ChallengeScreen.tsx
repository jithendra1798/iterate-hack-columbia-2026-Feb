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
  onStopCipherAudio?: () => void;
}

const ServerLogsPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full overflow-auto">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">&#9654; SERVER LOGS — LAYER 1</div>
    <pre className="text-xs text-foreground leading-relaxed overflow-auto max-h-[400px]">
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

    <div className="mt-4 border border-neon-amber/50 bg-neon-amber/10 p-3 rounded-sm">
      <div className="text-neon-amber text-sm font-bold mb-2">
        ⚠ HINT: ANALYZE THE LOGS CAREFULLY
      </div>
      <div className="text-foreground text-xs space-y-1">
        <div>Look for these clues in the logs:</div>
        <div className="text-primary mt-1">• <span className="text-secondary">SQL query concatenation</span> — input NOT sanitized</div>
        <div className="text-primary">• <span className="text-secondary">Port 8080</span> — debug mode active but monitored</div>
        <div className="text-primary">• <span className="text-secondary">SSL cert</span> — was expired, but patched 2h ago</div>
        <div className="text-neon-amber mt-2 font-bold">Which vulnerability is the safest entry point?</div>
      </div>
    </div>
  </div>
);

const CipherPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full overflow-auto">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">&#9654; VAULT CODE CIPHER — LAYER 2</div>

    <div className="space-y-4">
      {/* CIPHER decoded the first half */}
      <div className="bg-muted p-3 rounded-sm border border-primary/30">
        <div className="text-xs text-secondary mb-1">CIPHER DECODED (first half):</div>
        <div className="font-mono text-primary text-2xl tracking-widest text-center text-glow-green font-bold">
          O P E N
        </div>
      </div>

      {/* The pattern the player must solve */}
      <div className="border border-neon-amber/50 bg-neon-amber/10 p-4 rounded-sm">
        <div className="text-neon-amber text-sm font-bold mb-3">
          ⚠ YOUR TURN — Find the hidden pattern:
        </div>
        <div className="bg-card p-4 rounded-sm font-mono text-base leading-loose text-foreground">
          <div><span className="text-secondary text-glow-cyan font-bold text-lg">S</span>hadows fall across the digital walls</div>
          <div><span className="text-secondary text-glow-cyan font-bold text-lg">E</span>very circuit hums with encrypted light</div>
          <div><span className="text-secondary text-glow-cyan font-bold text-lg">S</span>ystems locked behind quantum shields</div>
          <div><span className="text-secondary text-glow-cyan font-bold text-lg">A</span> thousand keys have failed before</div>
          <div><span className="text-secondary text-glow-cyan font-bold text-lg">M</span>achines guard what humans desire</div>
          <div><span className="text-secondary text-glow-cyan font-bold text-lg">E</span>nter only those who see the pattern</div>
        </div>
        <div className="text-neon-amber text-sm font-bold mt-3">
          Read the FIRST LETTER of each line. What word do they spell?
        </div>
        <div className="text-xs text-foreground mt-2">
          Full vault code = OPEN + ??????
        </div>
      </div>
    </div>
  </div>
);

const MapPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full overflow-auto">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">&#9654; EXTRACTION MAP — LAYER 3</div>
    <pre className="text-sm text-primary leading-tight text-glow-green">
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
     S`}
    </pre>
    <div className="mt-3 text-xs text-foreground">
      V = VAULT &nbsp;&nbsp; X = EXTRACTION &nbsp;&nbsp; ── = CORRIDOR &nbsp;&nbsp; ═══ = SECURED
    </div>

    <div className="mt-4 border border-neon-amber/50 bg-neon-amber/10 p-3 rounded-sm">
      <div className="text-neon-amber text-sm font-bold mb-2">
        ⚠ CHOOSE YOUR ESCAPE ROUTE
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="border border-destructive/50 bg-destructive/10 p-3 rounded-sm">
          <div className="text-destructive font-bold mb-1">ROUTE A: Ventilation Shaft</div>
          <div className="text-foreground">Time: 90 seconds</div>
          <div className="text-destructive">Risk: HIGH (motion sensors)</div>
        </div>
        <div className="border border-primary/50 bg-primary/10 p-3 rounded-sm">
          <div className="text-primary font-bold mb-1">ROUTE B: Service Tunnel</div>
          <div className="text-foreground">Time: 180 seconds</div>
          <div className="text-primary">Risk: LOW (safe passage)</div>
        </div>
      </div>
    </div>
  </div>
);

const puzzles = [ServerLogsPuzzle, CipherPuzzle, MapPuzzle];

const ChallengeScreen = ({ messages, choices, onChoice, challengePhase, onTextSubmit, isLoading = false, isCipherSpeaking = false, onStopCipherAudio }: ChallengeScreenProps) => {
  const [textInput, setTextInput] = useState('');
  const PuzzleComponent = puzzles[challengePhase] || ServerLogsPuzzle;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech-to-text hook - auto-submit when speech is finalized
  const handleSpeechResult = useCallback((text: string) => {
    if (onTextSubmit && text.trim()) {
      onTextSubmit(text.trim());
    }
  }, [onTextSubmit]);

  const { isListening, interimTranscript, isSupported, error: sttError, startListening, stopListening } = useSpeechToText(handleSpeechResult);

  // Mic should NEVER be permanently disabled — allow voice even while CIPHER speaks or loading
  // Only disable if the browser doesn't support speech recognition
  const micDisabled = !isSupported;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ctrl+Space push-to-talk shortcut (global — works even in text input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ONLY Ctrl+Space triggers mic (plain Space was causing accidental activations)
      if (e.code === 'Space' && e.ctrlKey && !micDisabled && !isListening) {
        e.preventDefault();
        e.stopPropagation();
        // Stop CIPHER's audio so the user can speak
        if (onStopCipherAudio) onStopCipherAudio();
        startListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.ctrlKey && isListening) {
        e.preventDefault();
        e.stopPropagation();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening, micDisabled, startListening, stopListening, onStopCipherAudio]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && onTextSubmit) {
      onTextSubmit(textInput.trim());
      setTextInput('');
    }
  };

  const handleMicClick = () => {
    if (micDisabled) return;
    if (isListening) {
      stopListening();
    } else {
      // Stop CIPHER's audio so the user can speak
      if (onStopCipherAudio) onStopCipherAudio();
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
            {/* Voice status indicator in title bar */}
            {isSupported ? (
              <span className="ml-auto text-xs text-primary">MIC READY</span>
            ) : (
              <span className="ml-auto text-xs text-destructive">MIC UNAVAILABLE (use Chrome)</span>
            )}
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
            {isLoading && (
              <div className="text-sm text-neon-amber animate-pulse">
                [CIPHER] Processing...
              </div>
            )}
            <span className="terminal-cursor text-primary">█</span>
            <div ref={messagesEndRef} />
          </div>

          {/* Choices - show buttons if available */}
          {choices.length > 0 && (
            <div className="border-t border-border p-4 space-y-2">
              <div className="text-xs text-muted-foreground mb-2">&#9654; SELECT ACTION:</div>
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
            {(isListening || isCipherSpeaking || isLoading || sttError) && (
              <div className="mb-2 text-xs space-y-1">
                {sttError && (
                  <div className="text-destructive">&#9888; {sttError}</div>
                )}
                {isCipherSpeaking && (
                  <div className="text-secondary animate-pulse">&#9654; CIPHER is speaking... (you can still use mic)</div>
                )}
                {isListening && (
                  <div className="text-destructive animate-pulse font-bold">&#9654; LISTENING... speak now! (click 🎤 to stop and send)</div>
                )}
                {isLoading && !isListening && (
                  <div className="text-neon-amber animate-pulse">&#9654; Processing...</div>
                )}
              </div>
            )}

            {/* Show interim transcript while listening */}
            {isListening && interimTranscript && (
              <div className="mb-2 text-sm text-muted-foreground italic border border-border p-2 bg-muted/50">
                &#127908; &quot;{interimTranscript}&quot;
              </div>
            )}

            <div className="flex gap-2">
              {/* Mic button - always visible with clear states */}
              <button
                type="button"
                onClick={handleMicClick}
                onKeyDown={(e) => { if (e.code === 'Space') e.preventDefault(); }}
                disabled={micDisabled}
                className={`border px-3 py-2 text-sm transition-all min-w-[48px] ${
                  isListening
                    ? 'border-destructive bg-destructive/20 text-destructive animate-pulse ring-2 ring-destructive/50'
                    : micDisabled
                    ? 'border-muted-foreground/50 text-muted-foreground/50 cursor-not-allowed'
                    : 'border-secondary text-secondary hover:bg-secondary/10'
                }`}
                title={
                  micDisabled
                    ? 'Speech Recognition not available (use Chrome/Edge)'
                    : isListening
                    ? 'Click to stop and send'
                    : 'Click to start speaking (or Ctrl+SPACE)'
                }
              >
                {isListening ? '⏹' : '🎤'}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isListening ? 'Listening... speak now!' : 'Type your response or click 🎤 to speak...'}
                className="flex-1 bg-muted border border-border px-4 py-2 text-sm text-primary
                           focus:border-primary focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className={`border border-primary text-primary px-4 py-2 text-sm
                           transition-all ${!textInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'}`}
              >
                SEND
              </button>
            </div>

            {/* Help text */}
            <div className="mt-2 text-xs text-muted-foreground">
              {isSupported
                ? 'Click 🎤 to speak | Ctrl+SPACE shortcut | Type and press ENTER'
                : 'Voice not available — type your response and press ENTER'}
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

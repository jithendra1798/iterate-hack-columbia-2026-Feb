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
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">&#9654; INTERCEPTED TRAFFIC — LAYER 1</div>

    {/* Educational concept */}
    <div className="bg-muted p-2 rounded-sm mb-3 text-xs text-muted-foreground">
      <span className="text-secondary font-bold">CONCEPT:</span> SQL Injection occurs when user input is inserted directly into a database query without sanitization, allowing attackers to manipulate the query logic.
    </div>

    {/* Realistic access logs */}
    <pre className="text-xs text-foreground leading-relaxed overflow-auto max-h-[250px] bg-background/50 p-3 rounded-sm border border-border">
{`GET  /api/users?id=1            200  12ms
POST /api/auth {user,pass}       200  45ms
GET  /api/users?id=2             200  11ms
POST /api/auth {user,pass}       401  38ms
GET  /api/search?q=test          200  22ms`}
      <span className="text-neon-amber">{`
GET  /api/search?q=' OR 1=1 --   500  89ms  ← ERROR`}</span>
{`POST /api/auth {user,pass}       401  40ms
GET  /api/users?id=3             200  10ms`}
      <span className="text-destructive">{`
GET  /api/search?q=' UNION SELECT
     username,password FROM
     users --                     200  312ms ← DATA`}</span>
{`
GET  /debug:8080/status          403  BLOCKED
POST /admin (expired SSL cert)   ERR  REFUSED`}
    </pre>

    {/* The real question */}
    <div className="mt-3 border border-neon-amber/50 bg-neon-amber/10 p-3 rounded-sm text-xs">
      <div className="text-neon-amber font-bold mb-2">⚠ FIND THE EXPLOITABLE ENDPOINT</div>
      <div className="text-foreground space-y-1">
        <div>1. Which endpoint accepts <span className="text-destructive font-bold">unsanitized input</span>?</div>
        <div>2. What <span className="text-destructive font-bold">attack pattern</span> leaked data?</div>
        <div>3. Why did the other two paths <span className="text-muted-foreground">(port 8080, SSL)</span> fail?</div>
      </div>
      <div className="text-secondary mt-2 font-bold">Tell CIPHER which attack vector to use.</div>
    </div>
  </div>
);

const CipherPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full overflow-auto">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">&#9654; VAULT CIPHER — LAYER 2</div>

    {/* Educational concept */}
    <div className="bg-muted p-2 rounded-sm mb-3 text-xs text-muted-foreground">
      <span className="text-secondary font-bold">CONCEPT:</span> A Caesar cipher shifts each letter by N positions in the alphabet. To decrypt, shift back by N. Example: shift 3 → D becomes A.
    </div>

    {/* The encrypted vault code */}
    <div className="bg-background/50 p-3 rounded-sm border border-border mb-3">
      <div className="text-xs text-muted-foreground mb-1">ENCRYPTED VAULT CODE:</div>
      <div className="font-mono text-xl tracking-[0.4em] text-center text-destructive font-bold">
        VWLU ZLZHTL
      </div>
    </div>

    {/* CIPHER's half — decoded */}
    <div className="bg-primary/10 border border-primary/30 p-3 rounded-sm mb-3">
      <div className="text-xs text-secondary mb-1">CIPHER BRUTE-FORCED THE SHIFT:</div>
      <div className="font-mono text-sm text-foreground space-y-1">
        <div>Detected shift = <span className="text-primary font-bold text-lg">7</span></div>
        <div className="flex items-center gap-2">
          <span className="text-destructive">V W L U</span>
          <span className="text-muted-foreground">→ shift back 7 →</span>
          <span className="text-primary text-glow-green font-bold text-lg">O P E N</span>
        </div>
      </div>
    </div>

    {/* Player's turn */}
    <div className="border border-neon-amber/50 bg-neon-amber/10 p-3 rounded-sm">
      <div className="text-neon-amber font-bold text-sm mb-2">⚠ YOUR TURN — Decrypt the second half:</div>
      <div className="font-mono text-lg tracking-[0.3em] text-center text-destructive font-bold mb-2">
        Z &nbsp; L &nbsp; Z &nbsp; H &nbsp; T &nbsp; L
      </div>
      <div className="text-xs text-foreground mb-2">Apply the same shift (−7) to each letter:</div>

      {/* Alphabet reference strip */}
      <div className="bg-card p-2 rounded-sm font-mono text-xs overflow-x-auto">
        <div className="text-muted-foreground whitespace-nowrap">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</div>
        <div className="text-primary whitespace-nowrap">1 2 3 4 5 6 7 8 9 . . . . . . . . . . . . . . . . .</div>
      </div>

      <div className="text-xs text-muted-foreground mt-2">
        Example: Z(26) − 7 = S(19) &nbsp;|&nbsp; L(12) − 7 = E(5)
      </div>
      <div className="text-secondary font-bold text-sm mt-2">
        What 6-letter word does it decode to?
      </div>
    </div>
  </div>
);

const MapPuzzle = () => (
  <div className="border border-border border-glow-cyan bg-card p-4 rounded-sm h-full overflow-auto">
    <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">&#9654; ESCAPE PLAN — LAYER 3</div>

    {/* Educational concept */}
    <div className="bg-muted p-2 rounded-sm mb-3 text-xs text-muted-foreground">
      <span className="text-secondary font-bold">CONCEPT:</span> Firewall rules are evaluated top-to-bottom. The first matching rule wins. Understanding rule priority is key to finding open paths in a network.
    </div>

    {/* Firewall rules table */}
    <div className="bg-background/50 p-3 rounded-sm border border-border mb-3 overflow-x-auto">
      <div className="text-xs text-muted-foreground mb-2">BUILDING SECURITY SYSTEM — ACTIVE RULES:</div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-secondary border-b border-border">
            <th className="text-left py-1 pr-2">#</th>
            <th className="text-left py-1 pr-2">ZONE</th>
            <th className="text-left py-1 pr-2">PATH</th>
            <th className="text-left py-1 pr-2">SENSOR</th>
            <th className="text-left py-1">ACTION</th>
          </tr>
        </thead>
        <tbody className="text-foreground">
          <tr className="border-b border-border/30">
            <td className="py-1 pr-2 text-muted-foreground">1</td>
            <td className="py-1 pr-2">VAULT→ROOF</td>
            <td className="py-1 pr-2">Vent Shaft</td>
            <td className="py-1 pr-2 text-destructive">MOTION</td>
            <td className="py-1 text-neon-amber">ALERT</td>
          </tr>
          <tr className="border-b border-border/30">
            <td className="py-1 pr-2 text-muted-foreground">2</td>
            <td className="py-1 pr-2">VAULT→B1</td>
            <td className="py-1 pr-2">Service Tunnel</td>
            <td className="py-1 pr-2 text-primary">NONE</td>
            <td className="py-1 text-primary">ALLOW</td>
          </tr>
          <tr className="border-b border-border/30">
            <td className="py-1 pr-2 text-muted-foreground">3</td>
            <td className="py-1 pr-2">ROOF→EXT</td>
            <td className="py-1 pr-2">Zip Line</td>
            <td className="py-1 pr-2 text-primary">NONE</td>
            <td className="py-1 text-primary">ALLOW</td>
          </tr>
          <tr className="border-b border-border/30">
            <td className="py-1 pr-2 text-muted-foreground">4</td>
            <td className="py-1 pr-2">B1→GARAGE</td>
            <td className="py-1 pr-2">Corridor</td>
            <td className="py-1 pr-2 text-neon-amber">CAMERA</td>
            <td className="py-1 text-neon-amber">LOG</td>
          </tr>
          <tr>
            <td className="py-1 pr-2 text-muted-foreground">5</td>
            <td className="py-1 pr-2">ALL</td>
            <td className="py-1 pr-2">Main Entrance</td>
            <td className="py-1 pr-2 text-destructive">GUARD</td>
            <td className="py-1 text-destructive">DENY</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Decision */}
    <div className="border border-neon-amber/50 bg-neon-amber/10 p-3 rounded-sm text-xs">
      <div className="text-neon-amber font-bold mb-2">⚠ ANALYZE THE RULES — CHOOSE YOUR EXIT</div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="border border-destructive/40 bg-destructive/5 p-2 rounded-sm">
          <div className="text-destructive font-bold">ROUTE A: Vent → Roof → Zip</div>
          <div className="text-foreground mt-1">Rules 1+3 | Fast (90s)</div>
          <div className="text-destructive">⚠ Motion sensor on Rule 1</div>
        </div>
        <div className="border border-primary/40 bg-primary/5 p-2 rounded-sm">
          <div className="text-primary font-bold">ROUTE B: Tunnel → Garage</div>
          <div className="text-foreground mt-1">Rules 2+4 | Slow (180s)</div>
          <div className="text-primary">Camera logs but no alert</div>
        </div>
      </div>
      <div className="text-secondary font-bold mt-2">Which route has a viable path?</div>
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

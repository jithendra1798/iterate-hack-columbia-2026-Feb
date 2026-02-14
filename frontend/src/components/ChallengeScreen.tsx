import { useState } from 'react';
import type { AgentMessage, Choice } from '@/types/heist';

interface ChallengeScreenProps {
  messages: AgentMessage[];
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  challengePhase: number;
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

const ChallengeScreen = ({ messages, choices, onChoice, challengePhase }: ChallengeScreenProps) => {
  const PuzzleComponent = puzzles[challengePhase] || ServerLogsPuzzle;

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
                <span className="text-foreground ml-2">{msg.text}</span>
              </div>
            ))}
            <span className="terminal-cursor text-primary">█</span>
          </div>

          {/* Choices */}
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Puzzle */}
        <PuzzleComponent />
      </div>
    </div>
  );
};

export default ChallengeScreen;

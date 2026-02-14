import { useTypewriter } from '@/hooks/useTypewriter';

const CIPHER_INTRO = `> CIPHER v3.7.2 — SECURE CHANNEL ESTABLISHED
> Agent, welcome to Operation Midnight Protocol.
> 
> Your target: The Obsidian Vault — a quantum-encrypted 
> data fortress operated by Nexus Corp.
> 
> Three security layers stand between you and the payload.
> Each requires precision, speed, and partnership.
> 
> Study the vault blueprint carefully.
> Time is not on our side.
> 
> CIPHER out. Awaiting your signal to proceed.`;

interface BriefingScreenProps {
  onProceed: () => void;
}

const VaultBlueprint = () => (
  <div className="border border-border border-glow-green p-6 font-mono text-xs leading-relaxed">
    <div className="text-secondary text-glow-cyan mb-3 text-sm">╔══ VAULT BLUEPRINT ══╗</div>
    <pre className="text-muted-foreground">
{`
┌─────────────────────────────────────────┐
│           NEXUS CORP — LVL B7           │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │ LAYER 1 │──│ LAYER 2 │──│LAYER 3 │  │
│  │ FIREWALL│  │ CIPHER  │  │ VAULT  │  │
│  │ ░░░░░░░ │  │ ▓▓▓▓▓▓▓ │  │ ██████ │  │
│  └────┬────┘  └────┬────┘  └───┬────┘  │
│       │            │            │       │
│  ┌────┴────┐  ┌────┴────┐  ┌───┴────┐  │
│  │ SERVER  │  │ DECRYPT │  │EXTRACT │  │
│  │  LOGS   │  │ ENGINE  │  │ POINT  │  │
│  └─────────┘  └─────────┘  └────────┘  │
│                                         │
│  [SECURITY: ████████████ MAXIMUM]       │
│  [GUARDS:   12 ACTIVE PATROLS ]        │
│  [WINDOW:   300 SECONDS       ]        │
└─────────────────────────────────────────┘
`}
    </pre>
    <div className="text-secondary text-glow-cyan mt-3 text-sm">╚═══════════════════════╝</div>
  </div>
);

const BriefingScreen = ({ onProceed }: BriefingScreenProps) => {
  const { displayed, isDone } = useTypewriter(CIPHER_INTRO, 20);

  return (
    <div className="min-h-screen pt-14 px-6 pb-6 flex flex-col items-center scanlines">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary text-glow-green animate-flicker tracking-widest">
            ◆ OPERATION MIDNIGHT PROTOCOL ◆
          </h1>
          <div className="text-muted-foreground text-xs tracking-[0.3em]">
            CLASSIFIED // EYES ONLY // CLEARANCE OMEGA
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-border border-glow-green bg-card p-5 rounded-sm">
            <div className="text-secondary text-glow-cyan text-xs mb-3 tracking-wider">
              ▸ CIPHER TRANSMISSION
            </div>
            <div className="text-primary text-sm whitespace-pre-wrap min-h-[300px]">
              {displayed}
              {!isDone && <span className="terminal-cursor text-primary">█</span>}
            </div>
          </div>

          <VaultBlueprint />
        </div>

        {isDone && (
          <div className="flex justify-center">
            <button
              onClick={onProceed}
              className="border border-primary text-primary px-8 py-3 text-sm tracking-widest 
                         hover:bg-primary hover:text-primary-foreground transition-all duration-300
                         text-glow-green border-glow-green hover:shadow-[0_0_30px_hsl(120_100%_50%/0.3)]"
            >
              ▶ INITIATE HEIST
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BriefingScreen;

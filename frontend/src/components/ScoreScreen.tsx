interface ScoreScreenProps {
  timeTaken: number;
  choicesMade: string[];
  partnershipRating: number;
  onRestart: () => void;
}

const ScoreScreen = ({ timeTaken, choicesMade, partnershipRating, onRestart }: ScoreScreenProps) => {
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const stars = Math.round(partnershipRating / 20);

  const getRating = () => {
    if (partnershipRating >= 80) return { label: 'ELITE', color: 'text-primary text-glow-green' };
    if (partnershipRating >= 60) return { label: 'PROFICIENT', color: 'text-secondary text-glow-cyan' };
    if (partnershipRating >= 40) return { label: 'ADEQUATE', color: 'text-neon-amber' };
    return { label: 'COMPROMISED', color: 'text-destructive text-glow-red' };
  };

  const rating = getRating();

  return (
    <div className="min-h-screen pt-14 px-6 pb-6 flex items-center justify-center scanlines">
      <div className="max-w-lg w-full border border-border border-glow-green bg-card p-8 rounded-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs text-muted-foreground tracking-[0.3em]">OPERATION STATUS</div>
          <h1 className="text-3xl font-bold text-primary text-glow-green tracking-widest">
            HEIST COMPLETE
          </h1>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground text-sm">TIME ELAPSED</span>
            <span className="text-primary text-glow-green font-bold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground text-sm">DECISIONS MADE</span>
            <span className="text-primary text-glow-green font-bold">{choicesMade.length}</span>
          </div>

          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground text-sm">PARTNERSHIP</span>
            <span className="text-secondary text-glow-cyan font-bold">
              {'◆'.repeat(stars)}{'◇'.repeat(5 - stars)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">AGENT RATING</span>
            <span className={`font-bold tracking-wider ${rating.color}`}>{rating.label}</span>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-sm text-xs text-muted-foreground text-center">
          &gt; CIPHER: Well done, agent. The data has been secured.<br />
          &gt; Your performance has been logged. Until next time.
        </div>

        <button
          onClick={onRestart}
          className="w-full border border-secondary text-secondary px-6 py-3 text-sm tracking-widest
                     hover:bg-secondary hover:text-secondary-foreground transition-all duration-300
                     text-glow-cyan border-glow-cyan"
        >
          ▶ NEW OPERATION
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen;

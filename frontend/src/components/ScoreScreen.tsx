interface ServerScore {
  base_score?: number;
  time_bonus?: number;
  total_score?: number;
  time_remaining?: number;
  correct_choices?: number;
  total_choices?: number;
  grade?: string;
  penalties?: Array<{seconds: number; reason: string}>;
  choices?: Array<{phase: string; choice: string; correct: boolean}>;
}

interface ScoreScreenProps {
  timeTaken: number;
  choicesMade: string[];
  partnershipRating: number;
  onRestart: () => void;
  serverScore?: ServerScore | null;
}

const ScoreScreen = ({ timeTaken, choicesMade, partnershipRating, onRestart, serverScore }: ScoreScreenProps) => {
  // Use server score if available, otherwise calculate locally
  const totalScore = serverScore?.total_score ?? Math.round(partnershipRating);
  const timeRemaining = serverScore?.time_remaining ?? (300 - timeTaken);
  const grade = serverScore?.grade ?? (partnershipRating >= 80 ? 'ELITE' : partnershipRating >= 60 ? 'PROFICIENT' : 'AMATEUR');

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const getGradeStyle = (g: string) => {
    if (g.includes('LEGENDARY') || g.includes('ELITE')) return 'text-primary text-glow-green';
    if (g.includes('PROFESSIONAL') || g.includes('PROFICIENT')) return 'text-secondary text-glow-cyan';
    if (g.includes('AMATEUR') || g.includes('ADEQUATE')) return 'text-neon-amber';
    return 'text-destructive text-glow-red';
  };

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
            <span className="text-muted-foreground text-sm">TOTAL SCORE</span>
            <span className="text-primary text-glow-green font-bold text-xl">{totalScore}</span>
          </div>

          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground text-sm">TIME REMAINING</span>
            <span className="text-primary text-glow-green font-bold tabular-nums">
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground text-sm">CORRECT CHOICES</span>
            <span className="text-primary text-glow-green font-bold">
              {serverScore?.correct_choices ?? choicesMade.length}/{serverScore?.total_choices ?? choicesMade.length}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">AGENT RATING</span>
            <span className={`font-bold tracking-wider ${getGradeStyle(grade)}`}>
              {grade.split('—')[0].trim()}
            </span>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-sm text-xs text-muted-foreground text-center">
          &gt; CIPHER: {grade.includes('LEGENDARY') || grade.includes('ELITE')
            ? 'Perfect heist. Until next time, partner.'
            : grade.includes('BUSTED')
            ? 'We got caught... but we\'ll be back.'
            : 'Job done. We made it out.'
          }
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

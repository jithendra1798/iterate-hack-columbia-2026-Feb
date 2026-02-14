interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
}

const TimerBar = ({ timeRemaining, totalTime }: TimerBarProps) => {
  const pct = (timeRemaining / totalTime) * 100;
  const isUrgent = timeRemaining <= 60;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-background border-b border-border flex items-center px-4">
      <div className="flex-1 h-2 bg-muted rounded-sm overflow-hidden mr-4">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isUrgent ? 'bg-destructive' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-sm font-mono tabular-nums ${
          isUrgent ? 'text-destructive text-glow-red animate-pulse-glow' : 'text-primary text-glow-green'
        }`}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default TimerBar;

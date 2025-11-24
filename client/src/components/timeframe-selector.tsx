import { cn } from "@/lib/utils";

// Time-based ranges for truly time-based historical charts
export type Timeframe = "1m" | "15m" | "30m" | "1h" | "12h" | "24h";

interface TimeframeSelectorProps {
  currentTimeframe: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  className?: string;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1h" },
  { value: "12h", label: "12h" },
  { value: "24h", label: "24h" },
];

export function TimeframeSelector({ 
  currentTimeframe, 
  onChange, 
  className 
}: TimeframeSelectorProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-card/50 rounded-lg border border-border",
        className
      )}
      data-testid="timeframe-selector"
    >
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onChange(tf.value)}
          className={cn(
            "relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
            "hover:bg-accent/10",
            currentTimeframe === tf.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          data-testid={`timeframe-${tf.value}`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}

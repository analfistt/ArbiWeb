import { cn } from "@/lib/utils";

// Only include timeframes that CoinGecko accurately provides
// 1H = hourly candles, 4H = 4-hourly candles, 1D = daily candles
export type Timeframe = "1H" | "4H" | "1D";

interface TimeframeSelectorProps {
  currentTimeframe: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  className?: string;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1H", label: "1H" },
  { value: "4H", label: "4H" },
  { value: "1D", label: "1D" },
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

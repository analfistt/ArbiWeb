import { cn } from "@/lib/utils";

// Binance/TradingView-style timeframes for candlestick charts
export type Timeframe = "1H" | "24H" | "7D" | "30D" | "90D" | "1Y";

interface TimeframeSelectorProps {
  currentTimeframe: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  className?: string;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1H", label: "1H" },
  { value: "24H", label: "24H" },
  { value: "7D", label: "7D" },
  { value: "30D", label: "30D" },
  { value: "90D", label: "90D" },
  { value: "1Y", label: "1Y" },
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

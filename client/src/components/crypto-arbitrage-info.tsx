import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, ArrowUpRight } from "lucide-react";

export function CryptoArbitrageInfo() {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem("arbitrage-info-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("arbitrage-info-dismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <Card 
      className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm shadow-lg" 
      data-testid="crypto-arbitrage-info"
    >
      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground z-10"
        onClick={handleDismiss}
        data-testid="button-dismiss-info"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left: Content */}
          <div className="flex-1 space-y-4">
            {/* Pill Label */}
            <Badge 
              variant="outline" 
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border-primary/40 text-primary bg-primary/10 rounded-full"
              data-testid="badge-learn"
            >
              Learn · Crypto Arbitrage
            </Badge>

            {/* Title */}
            <h2 className="font-bold text-3xl md:text-4xl text-foreground leading-tight">
              What Is Crypto Arbitrage?
            </h2>

            {/* Subtitle */}
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              Crypto arbitrage is a trading strategy that profits from price differences of the same cryptocurrency on different exchanges. You buy where the price is lower and sell where it's higher, capturing the spread as profit.
            </p>

            {/* Example - Highlighted Card */}
            <div className="inline-flex items-center gap-2 bg-muted/40 border border-border/50 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">
                <strong className="text-foreground">Example:</strong> Buy BTC at $85,000 on Kraken and sell it at $85,400 on Binance – the{" "}
                <strong className="text-[hsl(var(--success))]">$400 gap</strong> is your arbitrage profit (before fees).
              </span>
            </div>

            {/* 3 Bullet Points - Compact Row/List */}
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                <span>No need to predict market direction</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                <span>Profit from price gaps, not speculation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                <span>Commonly seen as lower risk than regular trading</span>
              </li>
            </ul>
          </div>

          {/* Right: Decorative Graphic */}
          <div className="hidden lg:flex items-center justify-center lg:w-56 flex-shrink-0">
            <div className="relative">
              {/* Gradient Card with Upward Arrow */}
              <div className="relative w-40 h-40 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center shadow-xl">
                <TrendingUp className="w-20 h-20 text-primary/30" />
                {/* Upward Arrow Badge */}
                <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-[hsl(var(--success))]/20 border-2 border-[hsl(var(--success))]/40 flex items-center justify-center shadow-lg">
                  <ArrowUpRight className="w-7 h-7 text-[hsl(var(--success))]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

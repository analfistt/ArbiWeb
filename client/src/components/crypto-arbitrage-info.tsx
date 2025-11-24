import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, ArrowLeftRight, LineChart } from "lucide-react";

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
    <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm" data-testid="crypto-arbitrage-info">
      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        data-testid="button-dismiss-info"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Content */}
          <div className="flex-1 space-y-4">
            {/* Label Badge */}
            <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5">
              <LineChart className="w-3 h-3 mr-1.5" />
              Learn
            </Badge>

            {/* Title */}
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              What Is Crypto Arbitrage?
            </h2>

            {/* Introduction */}
            <p className="text-base text-muted-foreground leading-relaxed">
              Crypto arbitrage is a trading strategy that aims to profit from <strong className="text-foreground font-semibold">price differences</strong> of the same cryptocurrency across multiple exchanges. Instead of predicting market direction, traders exploit temporary price gaps by buying a coin where it's cheaper and selling it where it's more expensive, capturing the difference as profit.
            </p>

            {/* Example Section */}
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
                Example
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If Bitcoin is priced at <strong className="text-foreground font-semibold">$85,000 on Kraken</strong> but <strong className="text-foreground font-semibold">$85,400 on Binance</strong>, a trader can buy Bitcoin for $85,000 on Kraken and sell it for $85,400 on Binance. The profit is the <strong className="text-[hsl(var(--success))] font-semibold">$400 difference</strong> (before fees).
              </p>
            </div>

            {/* Why Section */}
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                Why Do Price Differences Occur?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cryptocurrency prices are not perfectly synchronized between exchanges. Variations in supply and demand, market liquidity, and regional activity create short-lived price differences that arbitrage traders can take advantage of.
              </p>
            </div>

            {/* Types Section */}
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-3">
                Main Types of Crypto Arbitrage
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>
                    <strong className="text-foreground font-semibold">Cross-Exchange Arbitrage:</strong> Buy on one exchange and sell on another at a higher price.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>
                    <strong className="text-foreground font-semibold">Triangular Arbitrage:</strong> Profit from exchange rate differences between three cryptocurrencies within the same exchange (for example BTC → ETH → XRP → BTC).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>
                    <strong className="text-foreground font-semibold">Futures Arbitrage:</strong> Earn from price gaps between spot prices and futures contracts.
                  </span>
                </li>
              </ul>
            </div>

            {/* Benefits Section */}
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-3">
                Benefits
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--success))] font-bold mt-0.5">•</span>
                  <span>You don't need to predict market trends.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--success))] font-bold mt-0.5">•</span>
                  <span>Profit comes from price gaps, not speculation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--success))] font-bold mt-0.5">•</span>
                  <span>Often considered less risky compared to traditional trading strategies.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Illustration (Optional) */}
          <div className="hidden lg:flex items-start justify-center lg:w-64 pt-8">
            <div className="relative">
              {/* Decorative Trading Icon */}
              <div className="relative w-48 h-48 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-center">
                <TrendingUp className="w-24 h-24 text-primary opacity-20" />
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 flex items-center justify-center">
                  <ArrowLeftRight className="w-8 h-8 text-[hsl(var(--success))]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Wifi, WifiOff, Loader2 } from "lucide-react";
import { TimeframeSelector, Timeframe } from "./timeframe-selector";
import { CandlestickChart, OHLCData } from "./candlestick-chart";
import { usePrice } from "@/lib/priceContext";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface TradingChartProps {
  assetSymbol: string;
  assetName?: string;
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

export function TradingChart({ 
  assetSymbol, 
  assetName,
  timeframe: externalTimeframe,
  onTimeframeChange: externalOnChange 
}: TradingChartProps) {
  // Use external timeframe if provided, otherwise use local state (fallback)
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>("24H");
  const timeframe = externalTimeframe ?? internalTimeframe;
  const setTimeframe = externalOnChange ?? setInternalTimeframe;
  
  // Get live price from price context
  const { getPrice, isConnected } = usePrice();
  const livePriceData = getPrice(assetSymbol);
  
  // Fetch OHLC candlestick data from CoinGecko
  const { data: candlesData, isLoading } = useQuery({
    queryKey: ["/api/market/candles", assetSymbol, timeframe],
    queryFn: async () => {
      const response = await fetch(
        `/api/market/candles/${assetSymbol}/${timeframe}`
      );
      if (!response.ok) throw new Error("Failed to fetch candles");
      return response.json();
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Process candle data and append live price as latest candle
  const { ohlcData, currentPrice, change24h } = useMemo(() => {
    const livePrice = livePriceData?.price || 0;
    const live24hChange = livePriceData?.changePercent24h || 0;
    
    if (!candlesData?.candles || candlesData.candles.length === 0) {
      return {
        ohlcData: [],
        currentPrice: livePrice,
        change24h: live24hChange
      };
    }
    
    let candles: OHLCData[] = candlesData.candles.map((candle: any) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    
    // Append live price as the latest candle (update last candle if recent)
    if (livePrice && candles.length > 0) {
      const now = Date.now();
      const lastCandle = candles[candles.length - 1];
      const timeSinceLastCandle = now - lastCandle.time;
      
      // If last candle is within 5 minutes, update it with live price
      if (timeSinceLastCandle < 5 * 60 * 1000) {
        lastCandle.close = livePrice;
        lastCandle.high = Math.max(lastCandle.high, livePrice);
        lastCandle.low = Math.min(lastCandle.low, livePrice);
      } else {
        // Add new candle with live price
        candles.push({
          time: now,
          open: livePrice,
          high: livePrice,
          low: livePrice,
          close: livePrice,
        });
      }
    }

    return {
      ohlcData: candles,
      currentPrice: livePrice || candles[candles.length - 1]?.close || 0,
      change24h: live24hChange
    };
  }, [candlesData, livePriceData]);

  const isPositive = change24h >= 0;

  return (
    <div className="w-full" data-testid={`trading-chart-${assetSymbol.toLowerCase()}`}>
      {/* Timeframe Selector & Status */}
      <div className="flex items-center justify-between mb-4">
        <TimeframeSelector 
          currentTimeframe={timeframe}
          onChange={setTimeframe}
        />
        {/* Live Price Status */}
        {isConnected ? (
          <Badge variant="outline" className="gap-1.5 border-[hsl(var(--success))] text-[hsl(var(--success))]">
            <Wifi className="w-3 h-3" />
            <span className="text-xs">Live</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 border-muted-foreground/50 text-muted-foreground">
            <WifiOff className="w-3 h-3" />
            <span className="text-xs">Offline</span>
          </Badge>
        )}
      </div>

      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              {assetSymbol}
            </span>
            {assetName && (
              <span className="text-xs text-muted-foreground ml-2">/ {assetName}</span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span 
              className="text-2xl font-bold tabular-nums"
              data-testid={`price-${assetSymbol.toLowerCase()}`}
            >
              ${currentPrice.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 text-sm font-semibold ${
          isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="tabular-nums" data-testid={`change-${assetSymbol.toLowerCase()}`}>
            {isPositive ? "+" : ""}{change24h.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground font-normal">24h</span>
        </div>
      </div>

      {/* Candlestick Chart */}
      {isLoading && ohlcData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading chart data...</span>
          </div>
        </div>
      ) : (
        <CandlestickChart 
          data={ohlcData}
          assetSymbol={assetSymbol}
          height={280}
        />
      )}
    </div>
  );
}

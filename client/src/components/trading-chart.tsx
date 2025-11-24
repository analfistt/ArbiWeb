import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import { TimeframeSelector, Timeframe } from "./timeframe-selector";
import { usePrice } from "@/lib/priceContext";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface TradingChartProps {
  assetSymbol: string;
  assetName?: string;
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

const ASSET_COLORS = {
  BTC: { line: "#F3BA2F", gradient: "rgba(243, 186, 47, 0.3)" },
  ETH: { line: "#627EEA", gradient: "rgba(98, 126, 234, 0.3)" },
  SOL: { line: "#14F195", gradient: "rgba(20, 241, 149, 0.3)" },
  DEFAULT: { line: "#F3BA2F", gradient: "rgba(243, 186, 47, 0.3)" }
};

// Map our timeframes to Binance intervals
function getBinanceInterval(timeframe: Timeframe): string {
  switch (timeframe) {
    case "1H":
      return "1h";
    case "4H":
      return "4h";
    case "1D":
      return "1d";
    default:
      return "1h";
  }
}

function getCandleLimit(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1H":
      return 24; // 24 hours
    case "4H":
      return 42; // ~7 days worth
    case "1D":
      return 30; // 30 days
    default:
      return 24;
  }
}

function formatTimeLabel(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);
  
  switch (timeframe) {
    case "1H":
    case "4H":
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false 
      });
    case "1H":
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false 
      });
    case "1D":
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
    case "1W":
    case "1M":
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
    default:
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false 
      });
  }
}

export function TradingChart({ 
  assetSymbol, 
  assetName,
  timeframe: externalTimeframe,
  onTimeframeChange: externalOnChange 
}: TradingChartProps) {
  // Use external timeframe if provided, otherwise use local state (fallback)
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>("1H");
  const timeframe = externalTimeframe ?? internalTimeframe;
  const setTimeframe = externalOnChange ?? setInternalTimeframe;
  
  // Get live price from price context
  const { getPrice, lastUpdate, isConnected } = usePrice();
  const livePriceData = getPrice(assetSymbol);
  
  // Fetch historical candle data from API
  const binanceInterval = getBinanceInterval(timeframe);
  const candleLimit = getCandleLimit(timeframe);
  
  const { data: candlesData, isLoading } = useQuery({
    queryKey: ["/api/market/candles", assetSymbol, binanceInterval, candleLimit],
    queryFn: async () => {
      const response = await fetch(
        `/api/market/candles/${assetSymbol}/${binanceInterval}?limit=${candleLimit}`
      );
      if (!response.ok) throw new Error("Failed to fetch candles");
      return response.json();
    },
    refetchInterval: 60000, // Refetch every 60 seconds to avoid rate limits
  });
  
  const { data, currentPrice, change24h, colors } = useMemo(() => {
    const assetColors = ASSET_COLORS[assetSymbol as keyof typeof ASSET_COLORS] || ASSET_COLORS.DEFAULT;
    
    // Use live price if available, otherwise fall back to last candle price
    const livePrice = livePriceData?.price;
    
    // Use live 24h change from price context (more reliable)
    const live24hChange = livePriceData?.changePercent24h || 0;
    
    if (!candlesData?.candles || candlesData.candles.length === 0) {
      // Return data with live price while candles are loading
      return {
        data: [],
        currentPrice: livePrice || 0,
        change24h: live24hChange,
        colors: assetColors
      };
    }
    
    const chartData: ChartDataPoint[] = candlesData.candles.map((candle: any) => ({
      time: formatTimeLabel(candle.time, timeframe),
      price: candle.close,
      timestamp: candle.time
    }));
    
    // Update last candle with live price if available
    if (livePrice && chartData.length > 0) {
      const lastCandle = chartData[chartData.length - 1];
      const now = Date.now();
      const timeSinceLastCandle = now - lastCandle.timestamp;
      
      // If within reasonable time, update the last point
      if (timeSinceLastCandle < 300000) { // Within 5 minutes
        lastCandle.price = livePrice;
      } else {
        // Add new point if data is stale
        chartData.push({
          time: formatTimeLabel(now, timeframe),
          price: livePrice,
          timestamp: now
        });
      }
    }

    return {
      data: chartData,
      currentPrice: livePrice || chartData[chartData.length - 1]?.price || 0,
      change24h: live24hChange, // Use reliable 24h change from API
      colors: assetColors
    };
  }, [assetSymbol, timeframe, candlesData, livePriceData, lastUpdate]);

  const isPositive = change24h >= 0;

  // Always show "24h" since change data is from API's 24h change
  const changePeriodLabel = "24h";

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
          <span className="text-xs text-muted-foreground font-normal">{changePeriodLabel}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart 
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${assetSymbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="0%" 
                stopColor={colors.line} 
                stopOpacity={0.35}
              />
              <stop 
                offset="95%" 
                stopColor={colors.line} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="0" 
            stroke="#1E293B"
            strokeWidth={0.5}
            vertical={false}
          />

          <XAxis 
            dataKey="time"
            stroke="#475569"
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />

          <YAxis 
            stroke="#475569"
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            domain={['auto', 'auto']}
            width={65}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              
              const data = payload[0].payload as ChartDataPoint;
              const date = new Date(data.timestamp);
              
              return (
                <div 
                  className="bg-[#020617] border border-[#1F2937] rounded-lg px-3 py-2 shadow-xl"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {date.toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">Price:</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      ${data.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              );
            }}
            cursor={{
              stroke: colors.line,
              strokeWidth: 1.5,
              strokeDasharray: "3 3",
              strokeOpacity: 0.7
            }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke={colors.line}
            strokeWidth={2.5}
            fill={`url(#gradient-${assetSymbol})`}
            isAnimationActive={true}
            animationDuration={800}
            dot={false}
            activeDot={{
              r: 5,
              fill: colors.line,
              stroke: "#020617",
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

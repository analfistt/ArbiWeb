import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wifi, WifiOff, Loader2 } from "lucide-react";
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

// Convert timeframe to minutes
function timeframeToMinutes(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    "1m": 1,
    "15m": 15,
    "30m": 30,
    "1h": 60,
    "12h": 720,
    "24h": 1440,
  };
  return map[timeframe];
}

// Determine if we should use buffered real-time data or fallback to CoinGecko OHLC
function useBufferedData(timeframe: Timeframe): boolean {
  // Use buffered data for short timeframes (up to 1 hour)
  return ["1m", "15m", "30m", "1h"].includes(timeframe);
}

// Format time labels based on timeframe
function formatTimeLabel(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);
  
  // For very short timeframes, show HH:mm
  if (["1m", "15m", "30m"].includes(timeframe)) {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  }
  
  // For 1 hour, show HH:mm
  if (timeframe === "1h") {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  }
  
  // For 12h and 24h, show date and time
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function TradingChart({ 
  assetSymbol, 
  assetName,
  timeframe: externalTimeframe,
  onTimeframeChange: externalOnChange 
}: TradingChartProps) {
  // Use external timeframe if provided, otherwise use local state (fallback)
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>("1h");
  const timeframe = externalTimeframe ?? internalTimeframe;
  const setTimeframe = externalOnChange ?? setInternalTimeframe;
  
  // Get live price from price context
  const { getPrice, lastUpdate, isConnected } = usePrice();
  const livePriceData = getPrice(assetSymbol);
  
  const minutes = timeframeToMinutes(timeframe);
  const shouldUseBuffered = useBufferedData(timeframe);
  
  // Fetch buffered historical data for short timeframes
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/market/history", assetSymbol, minutes],
    queryFn: async () => {
      const response = await fetch(
        `/api/market/history/${assetSymbol}?minutes=${minutes}`
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
    enabled: shouldUseBuffered,
    refetchInterval: 20000, // Refetch every 20 seconds to stay in sync with live data
  });

  // Fetch CoinGecko OHLC data for longer timeframes
  const { data: ohlcData, isLoading: ohlcLoading } = useQuery({
    queryKey: ["/api/market/candles", assetSymbol, "1h", minutes / 60],
    queryFn: async () => {
      const response = await fetch(
        `/api/market/candles/${assetSymbol}/1h?limit=${Math.ceil(minutes / 60)}`
      );
      if (!response.ok) throw new Error("Failed to fetch candles");
      return response.json();
    },
    enabled: !shouldUseBuffered,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const isLoading = shouldUseBuffered ? historyLoading : ohlcLoading;
  
  const { data, currentPrice, change24h, colors } = useMemo(() => {
    const assetColors = ASSET_COLORS[assetSymbol as keyof typeof ASSET_COLORS] || ASSET_COLORS.DEFAULT;
    
    // Use live price if available
    const livePrice = livePriceData?.price;
    const live24hChange = livePriceData?.changePercent24h || 0;
    
    // Process buffered data for short timeframes
    if (shouldUseBuffered) {
      if (!historyData?.history || historyData.history.length === 0) {
        return {
          data: [],
          currentPrice: livePrice || 0,
          change24h: live24hChange,
          colors: assetColors
        };
      }
      
      // Filter and format buffered data
      const now = Date.now();
      const cutoffTime = now - (minutes * 60 * 1000);
      
      let chartData: ChartDataPoint[] = historyData.history
        .filter((point: any) => point.timestamp >= cutoffTime)
        .map((point: any) => ({
          time: formatTimeLabel(point.timestamp, timeframe),
          price: point.price,
          timestamp: point.timestamp
        }));
      
      // Append live price as the latest point if we have it
      if (livePrice && chartData.length > 0) {
        const lastPoint = chartData[chartData.length - 1];
        const timeSinceLastPoint = now - lastPoint.timestamp;
        
        // Only append if enough time has passed (avoid duplicate points)
        if (timeSinceLastPoint > 15000) { // More than 15 seconds
          chartData.push({
            time: formatTimeLabel(now, timeframe),
            price: livePrice,
            timestamp: now
          });
        } else {
          // Update the last point with live price
          lastPoint.price = livePrice;
          lastPoint.timestamp = now;
          lastPoint.time = formatTimeLabel(now, timeframe);
        }
      }

      return {
        data: chartData,
        currentPrice: livePrice || chartData[chartData.length - 1]?.price || 0,
        change24h: live24hChange,
        colors: assetColors
      };
    }
    
    // Process OHLC data for longer timeframes
    if (!ohlcData?.candles || ohlcData.candles.length === 0) {
      return {
        data: [],
        currentPrice: livePrice || 0,
        change24h: live24hChange,
        colors: assetColors
      };
    }
    
    const chartData: ChartDataPoint[] = ohlcData.candles.map((candle: any) => ({
      time: formatTimeLabel(candle.time, timeframe),
      price: candle.close,
      timestamp: candle.time
    }));
    
    // Append live price if available
    if (livePrice && chartData.length > 0) {
      const now = Date.now();
      chartData.push({
        time: formatTimeLabel(now, timeframe),
        price: livePrice,
        timestamp: now
      });
    }

    return {
      data: chartData,
      currentPrice: livePrice || chartData[chartData.length - 1]?.price || 0,
      change24h: live24hChange,
      colors: assetColors
    };
  }, [assetSymbol, timeframe, minutes, shouldUseBuffered, historyData, ohlcData, livePriceData, lastUpdate]);

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

      {isLoading && data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading chart data...</span>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

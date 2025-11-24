import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradingChartProps {
  assetSymbol: string;
  assetName?: string;
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

export function TradingChart({ assetSymbol, assetName }: TradingChartProps) {
  const { data, currentPrice, change24h, colors } = useMemo(() => {
    const basePrice = 
      assetSymbol === "BTC" ? 43250 :
      assetSymbol === "ETH" ? 2680 :
      assetSymbol === "SOL" ? 98.5 : 100;

    const dataPoints = 50;
    const chartData: ChartDataPoint[] = [];
    const now = Date.now();

    for (let i = 0; i < dataPoints; i++) {
      const variance = (Math.random() - 0.5) * basePrice * 0.025;
      const trend = i * (basePrice * 0.0004);
      const price = basePrice + variance + trend;
      
      const timestamp = now - (dataPoints - i) * 30 * 60 * 1000;
      const date = new Date(timestamp);
      const timeStr = date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false 
      });

      chartData.push({
        time: timeStr,
        price: Number(price.toFixed(2)),
        timestamp
      });
    }

    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    const assetColors = ASSET_COLORS[assetSymbol as keyof typeof ASSET_COLORS] || ASSET_COLORS.DEFAULT;

    return {
      data: chartData,
      currentPrice: lastPrice,
      change24h: change,
      colors: assetColors
    };
  }, [assetSymbol]);

  const isPositive = change24h >= 0;

  return (
    <div className="w-full" data-testid={`trading-chart-${assetSymbol.toLowerCase()}`}>
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

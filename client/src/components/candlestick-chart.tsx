import { useEffect, useRef } from "react";
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  LineData, 
  UTCTimestamp,
  AreaSeries
} from "lightweight-charts";

export interface OHLCData {
  time: number; // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: OHLCData[];
  assetSymbol: string;
  height?: number;
}

export function CandlestickChart({ data, assetSymbol, height = 280 }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  // Asset-specific colors
  const ASSET_COLORS = {
    BTC: "#F3BA2F",
    ETH: "#627EEA",
    SOL: "#14F195",
  };
  const accentColor = ASSET_COLORS[assetSymbol as keyof typeof ASSET_COLORS] || ASSET_COLORS.BTC;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with Binance-like dark theme
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "#020617" },
        textColor: "#64748B",
      },
      grid: {
        vertLines: { color: "#1E293B" },
        horzLines: { color: "#1E293B" },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: accentColor,
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: accentColor,
        },
        horzLine: {
          color: accentColor,
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: accentColor,
        },
      },
      rightPriceScale: {
        borderColor: "#1E293B",
      },
      timeScale: {
        borderColor: "#1E293B",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add area series (line with gradient fill underneath)
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: accentColor,
      topColor: `${accentColor}40`, // 25% opacity for gradient top
      bottomColor: `${accentColor}00`, // 0% opacity for gradient bottom
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    areaSeriesRef.current = areaSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [height, accentColor]);

  // Update data when it changes
  useEffect(() => {
    if (!areaSeriesRef.current || !data.length) return;

    // Convert OHLC data to line data (using close price)
    const chartData: LineData[] = data.map((candle) => ({
      time: Math.floor(candle.time / 1000) as UTCTimestamp, // Convert to seconds
      value: candle.close, // Use close price for the line
    }));

    areaSeriesRef.current.setData(chartData);

    // Fit content to visible range
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full"
      data-testid={`candlestick-chart-${assetSymbol.toLowerCase()}`}
    />
  );
}

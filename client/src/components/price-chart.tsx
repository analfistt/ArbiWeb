import { useEffect, useRef } from "react";

interface PriceChartProps {
  symbol: string;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = 300 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Generate mock price data - will be replaced with real CoinGecko data in Task 2
    const dataPoints = 50;
    const basePrice = symbol === "BTC" ? 43000 : symbol === "ETH" ? 2650 : 98;
    const data: number[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const variance = (Math.random() - 0.5) * basePrice * 0.02;
      const trend = i * (basePrice * 0.0003);
      data.push(basePrice + variance + trend);
    }

    // Draw chart
    const width = rect.width;
    const height = 300;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max
    const minPrice = Math.min(...data);
    const maxPrice = Math.max(...data);
    const priceRange = maxPrice - minPrice;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.01)");

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    data.forEach((price, i) => {
      const x = padding + (i / (dataPoints - 1)) * chartWidth;
      const y = padding + ((maxPrice - price) / priceRange) * chartHeight;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((price, i) => {
      const x = padding + (i / (dataPoints - 1)) * chartWidth;
      const y = padding + ((maxPrice - price) / priceRange) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = "rgb(59, 130, 246)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = "rgba(128, 128, 128, 0.2)";
    ctx.lineWidth = 1;

    // Y-axis labels
    ctx.fillStyle = "rgb(128, 128, 128)";
    ctx.font = "12px Inter";
    ctx.textAlign = "right";
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const price = minPrice + (priceRange * i / ySteps);
      const y = height - padding - (i / ySteps) * chartHeight;
      ctx.fillText(`$${price.toFixed(0)}`, padding - 10, y + 4);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Current price indicator
    const currentPrice = data[data.length - 1];
    const isPositive = currentPrice > data[0];
    
    ctx.fillStyle = isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
    ctx.font = "bold 16px Space Grotesk";
    ctx.textAlign = "left";
    ctx.fillText(
      `$${currentPrice.toFixed(2)}`,
      padding,
      30
    );

    ctx.font = "12px Inter";
    const change = ((currentPrice - data[0]) / data[0] * 100);
    ctx.fillText(
      `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      padding + 100,
      30
    );

  }, [symbol]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: "300px" }}
        data-testid={`chart-${symbol.toLowerCase()}`}
      />
    </div>
  );
}

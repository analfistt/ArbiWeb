import { wsManager } from "./websocket";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalPricePoint {
  timestamp: number;
  price: number;
}

class PriceService {
  private prices: Map<string, PriceData> = new Map();
  private priceHistory: Map<string, HistoricalPricePoint[]> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly coinGeckoIds = new Map([
    ["BTC", "bitcoin"],
    ["ETH", "ethereum"],
    ["SOL", "solana"],
    ["USDT", "tether"],
  ]);
  private readonly MAX_HISTORY_HOURS = 24; // Keep 24 hours of data
  
  // Cache for OHLC data to reduce API calls and handle rate limits
  private candleCache: Map<string, { data: CandleData[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60000; // Cache for 60 seconds

  constructor() {
    this.initializePrices();
    this.initializeHistory();
  }

  private initializePrices() {
    this.coinGeckoIds.forEach((_, symbol) => {
      this.prices.set(symbol, {
        symbol,
        price: 0,
        change24h: 0,
        changePercent24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        timestamp: Date.now(),
      });
    });
  }

  private initializeHistory() {
    this.coinGeckoIds.forEach((_, symbol) => {
      this.priceHistory.set(symbol, []);
    });
  }

  private addToHistory(symbol: string, price: number, timestamp: number) {
    const history = this.priceHistory.get(symbol) || [];
    
    // Add new data point
    history.push({ timestamp, price });
    
    // Remove data older than MAX_HISTORY_HOURS
    const cutoffTime = timestamp - (this.MAX_HISTORY_HOURS * 60 * 60 * 1000);
    const filteredHistory = history.filter(point => point.timestamp >= cutoffTime);
    
    this.priceHistory.set(symbol, filteredHistory);
  }

  getHistoricalPrices(symbol: string, minutes: number): HistoricalPricePoint[] {
    const history = this.priceHistory.get(symbol.toUpperCase()) || [];
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    
    return history.filter(point => point.timestamp >= cutoffTime);
  }

  async start() {
    console.log("🚀 Starting price service using CoinGecko API...");
    await this.fetchPrices();
    this.startPolling();
  }

  private async fetchPrices() {
    try {
      const ids = Array.from(this.coinGeckoIds.values()).join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
      
      const response = await fetch(url);
      
      if (response.status === 429) {
        console.warn("⚠️  Rate limit hit, waiting before retry...");
        return; // Skip this cycle, will try again in next interval
      }
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const now = Date.now();
      this.coinGeckoIds.forEach((coinId, symbol) => {
        const coinData = data[coinId];
        if (coinData) {
          const price = coinData.usd || 0;
          const timestamp = (coinData.last_updated_at || now / 1000) * 1000;
          
          this.prices.set(symbol, {
            symbol,
            price,
            change24h: 0, // CoinGecko doesn't provide absolute change
            changePercent24h: coinData.usd_24h_change || 0,
            high24h: 0,
            low24h: 0,
            volume24h: coinData.usd_24h_vol || 0,
            timestamp,
          });
          
          // Add to historical buffer
          if (price > 0) {
            this.addToHistory(symbol, price, timestamp);
          }
        }
      });

      console.log("✅ Prices fetched from CoinGecko");
      this.broadcastPrices();
    } catch (error) {
      console.error("❌ Failed to fetch prices from CoinGecko:", error);
    }
  }

  private startPolling() {
    // Poll every 20 seconds to respect CoinGecko rate limits (3 calls/min)
    this.pollingInterval = setInterval(() => {
      this.fetchPrices();
    }, 20000);
    
    console.log("✅ Price polling started (20s interval - respecting rate limits)");
  }

  private broadcastPrices() {
    const pricesArray = Array.from(this.prices.values());
    wsManager.broadcast("price_update", {
      prices: pricesArray,
      timestamp: Date.now(),
    });
  }


  getPrices(): PriceData[] {
    return Array.from(this.prices.values());
  }

  getPrice(symbol: string): PriceData | undefined {
    return this.prices.get(symbol.toUpperCase());
  }

  async getCandles(
    symbol: string,
    interval: string,
    limit: number = 100
  ): Promise<CandleData[]> {
    // Use CoinGecko OHLC endpoint for real candlestick data with caching
    const cacheKey = `${symbol}-${interval}`;
    
    // Check cache first
    const cached = this.candleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 Cache hit for ${cacheKey}`);
      return this.enforceTimeframeWindow(cached.data, interval).slice(-limit);
    }
    
    // Retry logic with exponential backoff for rate limiting
    const maxRetries = 4; // 4 attempts: initial + 3 retries with delays 1s, 2s, 5s
    const retryDelays = [1000, 2000, 5000]; // 1s, 2s, 5s delays
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const coinId = this.coinGeckoIds.get(symbol.toUpperCase());
        if (!coinId) {
          throw new Error(`Unknown symbol: ${symbol}`);
        }

        // Map interval to CoinGecko days parameter
        const days = this.intervalToDays(interval);
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
        
        if (attempt > 0) {
          // Exponential backoff with predefined delays: 1s, 2s, 5s
          const delay = retryDelays[attempt - 1];
          console.log(`🔄 Retry ${attempt + 1}/${maxRetries} for ${cacheKey} after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.log(`🔄 Fetching OHLC data for ${cacheKey} (days=${days})...`);
        }
        
        const response = await fetch(url);
        
        // Handle rate limiting with retry
        if (response.status === 429) {
          console.warn(`⚠️  Rate limit hit for ${cacheKey} (attempt ${attempt + 1}/${maxRetries})`);
          // Return cached data even if expired, better than retrying forever
          if (cached && attempt === maxRetries - 1) {
            console.log(`📦 Returning stale cache for ${cacheKey} after max retries`);
            return this.enforceTimeframeWindow(cached.data, interval).slice(-limit);
          }
          lastError = new Error("Rate limit exceeded");
          continue; // Retry
        }
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // CoinGecko OHLC returns: [timestamp, open, high, low, close]
        const candles: CandleData[] = data.map((ohlc: number[]) => ({
          time: ohlc[0],
          open: ohlc[1],
          high: ohlc[2],
          low: ohlc[3],
          close: ohlc[4],
          volume: 0, // CoinGecko OHLC doesn't include volume
        }));
        
        // Cache the result
        this.candleCache.set(cacheKey, { data: candles, timestamp: Date.now() });
        console.log(`✅ OHLC data cached for ${cacheKey} (${candles.length} candles)`);
        
        // Enforce timeframe window before returning
        return this.enforceTimeframeWindow(candles, interval).slice(-limit);
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Failed to fetch candles for ${symbol} (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        // On last attempt, try to return cached data
        if (attempt === maxRetries - 1 && cached) {
          console.log(`📦 Returning stale cache for ${cacheKey} after all retries failed`);
          return this.enforceTimeframeWindow(cached.data, interval).slice(-limit);
        }
      }
    }
    
    // All retries failed - try to construct candles from buffered price history as last resort
    console.warn(`⚠️  All retries exhausted for ${cacheKey}, attempting to construct from price history...`);
    const fallbackCandles = this.constructCandlesFromHistory(symbol, interval);
    
    if (fallbackCandles.length > 0) {
      console.log(`📊 Returning ${fallbackCandles.length} candles from price history for ${cacheKey}`);
      return fallbackCandles.slice(-limit);
    }
    
    // Final fallback: try to synthesize from current price map
    const currentPrice = this.getPrice(symbol);
    if (currentPrice) {
      const now = Date.now();
      const syntheticCandle: CandleData = {
        time: now,
        open: currentPrice.price,
        high: currentPrice.price,
        low: currentPrice.price,
        close: currentPrice.price,
        volume: 0,
      };
      console.warn(`⚠️  Returning synthetic candle from current price (${currentPrice.price}) for ${cacheKey}`);
      return [syntheticCandle];
    }
    
    // ABSOLUTE FINAL FALLBACK: Return zero candle to GUARANTEE no 500 errors
    // This handles extreme cold start where getPrice() returns undefined
    console.error(`🚨 ABSOLUTE FINAL FALLBACK: Returning zero candle for ${cacheKey} (no data available)`);
    return [{
      time: Date.now(),
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0,
    }];
  }
  
  private constructCandlesFromHistory(symbol: string, interval: string): CandleData[] {
    // Fallback: construct simple candles from buffered price history
    // This prevents 500 errors when CoinGecko is rate-limiting and no cache exists
    const history = this.getHistoricalPrices(symbol, this.intervalToMinutes(interval));
    
    if (history.length === 0) {
      return []; // No data available at all
    }
    
    // Special case: single price point (cold start scenario)
    // Synthesize a candle using the same price for O/H/L/C
    if (history.length === 1) {
      const point = history[0];
      return [{
        time: point.timestamp,
        open: point.price,
        high: point.price,
        low: point.price,
        close: point.price,
        volume: 0,
      }];
    }
    
    // Group price points into candles (simple aggregation)
    const candles: CandleData[] = [];
    const candleInterval = this.getCandleIntervalMs(interval);
    
    let currentCandle: { time: number; prices: number[] } | null = null;
    
    for (const point of history) {
      const candleTime = Math.floor(point.timestamp / candleInterval) * candleInterval;
      
      if (!currentCandle || currentCandle.time !== candleTime) {
        // Close previous candle
        if (currentCandle && currentCandle.prices.length > 0) {
          candles.push({
            time: currentCandle.time,
            open: currentCandle.prices[0],
            high: Math.max(...currentCandle.prices),
            low: Math.min(...currentCandle.prices),
            close: currentCandle.prices[currentCandle.prices.length - 1],
            volume: 0,
          });
        }
        
        // Start new candle
        currentCandle = { time: candleTime, prices: [point.price] };
      } else {
        currentCandle.prices.push(point.price);
      }
    }
    
    // Close last candle
    if (currentCandle && currentCandle.prices.length > 0) {
      candles.push({
        time: currentCandle.time,
        open: currentCandle.prices[0],
        high: Math.max(...currentCandle.prices),
        low: Math.min(...currentCandle.prices),
        close: currentCandle.prices[currentCandle.prices.length - 1],
        volume: 0,
      });
    }
    
    return candles;
  }
  
  private intervalToMinutes(interval: string): number {
    // Convert interval to minutes for price history lookup
    const map: Record<string, number> = {
      "1H": 60,
      "24H": 1440,
      "7D": 10080,
      "30D": 43200,
      "90D": 129600,
      "1Y": 525600,
    };
    return map[interval] || 60;
  }
  
  private getCandleIntervalMs(interval: string): number {
    // Get candle interval in milliseconds for grouping price points
    const map: Record<string, number> = {
      "1H": 5 * 60 * 1000,    // 5-minute candles for 1H view
      "24H": 60 * 60 * 1000,  // 1-hour candles for 24H view
      "7D": 4 * 60 * 60 * 1000, // 4-hour candles for 7D view
      "30D": 24 * 60 * 60 * 1000, // Daily candles for 30D view
      "90D": 24 * 60 * 60 * 1000, // Daily candles for 90D view
      "1Y": 7 * 24 * 60 * 60 * 1000, // Weekly candles for 1Y view
    };
    return map[interval] || 60 * 60 * 1000;
  }
  
  private enforceTimeframeWindow(candles: CandleData[], interval: string): CandleData[] {
    // Post-process OHLC data to enforce correct timeframe windows
    // This ensures "1H" shows only 1 hour, not 24 hours
    if (candles.length === 0) return candles;
    
    const now = Date.now();
    let cutoffTime: number;
    
    switch (interval) {
      case "1H":
        cutoffTime = now - (1 * 60 * 60 * 1000); // Last 1 hour
        break;
      case "24H":
        cutoffTime = now - (24 * 60 * 60 * 1000); // Last 24 hours
        break;
      case "7D":
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case "30D":
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case "90D":
        cutoffTime = now - (90 * 24 * 60 * 60 * 1000); // Last 90 days
        break;
      case "1Y":
        cutoffTime = now - (365 * 24 * 60 * 60 * 1000); // Last 1 year
        break;
      default:
        return candles; // No filtering for unknown intervals
    }
    
    return candles.filter(candle => candle.time >= cutoffTime);
  }

  private intervalToDays(interval: string): number {
    // CoinGecko OHLC accurate mappings for Binance-style timeframes:
    // days=1 → hourly candles (24 points)
    // days=7 → 4-hourly candles (~42 points)
    // days=30 → daily candles (30 points)
    // days=90 → daily candles (90 points)
    // days=365 → daily candles (365 points)
    const map: Record<string, number> = {
      "1H": 1,      // Hourly data for 1 hour (actually 24h but we show 1h)
      "24H": 1,     // Hourly data for 24 hours
      "7D": 7,      // 4-hourly data for 7 days
      "30D": 30,    // Daily data for 30 days
      "90D": 90,    // Daily data for 90 days
      "1Y": 365,    // Daily data for 1 year
      // Legacy support
      "1h": 1,
      "4h": 7,
      "1d": 30,
    };
    return map[interval] || 1;
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log("🛑 Price service stopped");
  }
}

export const priceService = new PriceService();

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
    // Use CoinGecko OHLC endpoint for real candlestick data
    try {
      const coinId = this.coinGeckoIds.get(symbol.toUpperCase());
      if (!coinId) {
        throw new Error(`Unknown symbol: ${symbol}`);
      }

      // Map interval to CoinGecko days parameter
      const days = this.intervalToDays(interval);
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
      
      const response = await fetch(url);
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
      
      return candles.slice(-limit);
    } catch (error) {
      console.error(`❌ Failed to fetch candles for ${symbol}:`, error);
      throw error;
    }
  }

  private intervalToDays(interval: string): number {
    // CoinGecko OHLC accurate mappings:
    // days=1 → hourly candles (24 points)
    // days=7 → 4-hourly candles (~42 points)
    // days=30 → daily candles (30 points)
    const map: Record<string, number> = {
      "1h": 1,    // Hourly data for 24 hours
      "4h": 7,    // 4-hourly data for ~7 days
      "1d": 30,   // Daily data for 30 days
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

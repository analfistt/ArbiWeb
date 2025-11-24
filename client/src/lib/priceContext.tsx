import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./auth";

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

interface PriceContextValue {
  prices: Map<string, PriceData>;
  isConnected: boolean;
  lastUpdate: number;
  getPrice: (symbol: string) => PriceData | undefined;
}

const PriceContext = createContext<PriceContextValue | null>(null);

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth(); // Get token from auth context
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial prices from REST API
  useEffect(() => {
    const fetchInitialPrices = async () => {
      try {
        const response = await fetch("/api/market/prices");
        if (response.ok) {
          const data = await response.json();
          const priceMap = new Map<string, PriceData>();
          data.prices.forEach((price: PriceData) => {
            priceMap.set(price.symbol, price);
          });
          setPrices(priceMap);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error("Failed to fetch initial prices:", error);
      }
    };

    fetchInitialPrices();
  }, []);

  // Connect to WebSocket for live price updates - watch for token changes
  useEffect(() => {
    const connectWebSocket = () => {
      if (!token) {
        console.log("No auth token, will retry WebSocket when token available");
        setIsConnected(false);
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

      console.log("📡 Connecting to price WebSocket...");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Price WebSocket connected");
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "price_update" && message.payload.prices) {
            const priceMap = new Map<string, PriceData>();
            message.payload.prices.forEach((price: PriceData) => {
              priceMap.set(price.symbol, price);
            });
            setPrices(priceMap);
            setLastUpdate(Date.now());
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ Price WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("🔌 Price WebSocket disconnected");
        setIsConnected(false);
        
        // Schedule reconnect
        if (!reconnectTimeoutRef.current) {
          console.log("⏱️  Reconnecting in 5 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, 5000);
        }
      };
    };

    connectWebSocket();

    // Cleanup on unmount or token change
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [token]); // Re-run when token changes (login/logout)
  
  // Fallback: Poll REST API every 10 seconds if WebSocket is down
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!isConnected) {
        // WebSocket is down, fetch from REST API
        try {
          const response = await fetch("/api/market/prices");
          if (response.ok) {
            const data = await response.json();
            const priceMap = new Map<string, PriceData>();
            data.prices.forEach((price: PriceData) => {
              priceMap.set(price.symbol, price);
            });
            setPrices(priceMap);
            setLastUpdate(Date.now());
          }
        } catch (error) {
          console.error("Failed to poll prices:", error);
        }
      }
    }, 10000); // Poll every 10 seconds when disconnected
    
    return () => clearInterval(pollInterval);
  }, [isConnected]);

  const getPrice = (symbol: string): PriceData | undefined => {
    return prices.get(symbol.toUpperCase());
  };

  return (
    <PriceContext.Provider value={{ prices, isConnected, lastUpdate, getPrice }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error("usePrice must be used within PriceProvider");
  }
  return context;
}

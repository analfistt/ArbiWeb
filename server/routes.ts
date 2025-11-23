import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertTransactionSchema, insertAdminAdjustmentSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  isAdmin?: boolean;
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.isAdmin = decoded.isAdmin;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Middleware to verify admin
async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ Authentication Routes ============
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(validatedData);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ============ Dashboard Routes ============
  
  // Get dashboard data
  app.get("/api/dashboard", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const wallet = await storage.getWalletByUserId(req.userId!);
      const positions = await storage.getPortfolioPositions(req.userId!);

      // Calculate realized and unrealized P/L
      const realizedPL = positions.reduce((sum, pos) => sum + pos.profitLossUsd, 0);
      const unrealizedPL = positions
        .filter(pos => pos.profitLossUsd > 0)
        .reduce((sum, pos) => sum + pos.profitLossUsd, 0);

      res.json({
        totalBalance: wallet?.totalBalanceUsd || 0,
        availableBalance: wallet?.availableBalanceUsd || 0,
        realizedPL,
        unrealizedPL,
        activePositions: positions.length,
        positions,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to get dashboard data" });
    }
  });

  // ============ Crypto Prices Routes (CoinGecko) ============
  
  // Get current crypto prices
  app.get("/api/prices", async (req, res) => {
    try {
      const symbols = (req.query.symbols as string)?.split(",") || ["bitcoin", "ethereum", "solana"];
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(",")}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch prices from CoinGecko");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Prices error:", error);
      res.status(500).json({ error: "Failed to get prices" });
    }
  });

  // Get price history for charts
  app.get("/api/prices/history/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const days = req.query.days || "1";
      
      const coinMap: Record<string, string> = {
        btc: "bitcoin",
        eth: "ethereum",
        sol: "solana",
        bitcoin: "bitcoin",
        ethereum: "ethereum",
        solana: "solana",
      };

      const coinId = coinMap[symbol.toLowerCase()] || "bitcoin";
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch price history");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Price history error:", error);
      res.status(500).json({ error: "Failed to get price history" });
    }
  });

  // Get arbitrage opportunities (simulated based on real prices)
  app.get("/api/arbitrage-opportunities", async (req, res) => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,ripple&vs_currencies=usd"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }

      const prices = await response.json();
      
      // Generate simulated arbitrage opportunities with small spreads
      const exchanges = ["Binance", "Kraken", "Coinbase", "Gemini", "Bitfinex", "KuCoin"];
      const opportunities: any[] = [];

      Object.entries(prices).forEach(([coin, data]: [string, any]) => {
        const basePrice = data.usd;
        const buyExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        let sellExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        while (sellExchange === buyExchange) {
          sellExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        }

        const spread = 0.5 + Math.random() * 2; // 0.5% to 2.5% spread
        const buyPrice = basePrice * (1 - spread / 200);
        const sellPrice = basePrice * (1 + spread / 200);

        const symbolMap: Record<string, string> = {
          bitcoin: "BTC",
          ethereum: "ETH",
          solana: "SOL",
          cardano: "ADA",
          ripple: "XRP",
        };

        opportunities.push({
          asset: symbolMap[coin] || coin.toUpperCase(),
          buyExchange,
          buyPrice: Number(buyPrice.toFixed(2)),
          sellExchange,
          sellPrice: Number(sellPrice.toFixed(2)),
          spread: Number(spread.toFixed(2)),
        });
      });

      res.json(opportunities);
    } catch (error) {
      console.error("Arbitrage opportunities error:", error);
      res.status(500).json({ error: "Failed to get arbitrage opportunities" });
    }
  });

  // ============ Transaction Routes ============
  
  // Create withdrawal request
  app.post("/api/transactions/withdraw", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const wallet = await storage.getWalletByUserId(req.userId!);
      if (!wallet || wallet.availableBalanceUsd < req.body.amountUsd) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const transaction = await storage.createTransaction({
        userId: req.userId!,
        type: "withdrawal",
        amountUsd: req.body.amountUsd,
        destinationAddress: req.body.destinationAddress,
      });
      res.json(transaction);
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ error: "Failed to create withdrawal" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.userId!);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // ============ Admin Routes ============
  
  // Get all users (admin only)
  app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Get wallet and position data for each user
      const usersWithData = await Promise.all(
        users.map(async (user) => {
          const wallet = await storage.getWalletByUserId(user.id);
          const positions = await storage.getPortfolioPositions(user.id);
          const realizedPL = positions.reduce((sum, pos) => sum + (pos.profitLossUsd > 0 ? pos.profitLossUsd : 0), 0);
          const unrealizedPL = positions.reduce((sum, pos) => sum + (pos.profitLossUsd < 0 ? pos.profitLossUsd : 0), 0);

          return {
            id: user.id,
            email: user.email,
            balance: wallet?.totalBalanceUsd || 0,
            realizedPL,
            unrealizedPL,
            status: "active",
            createdAt: user.createdAt,
          };
        })
      );

      res.json(usersWithData);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Get all transactions (admin only)
  app.get("/api/admin/transactions", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      
      // Add user email to each transaction
      const transactionsWithEmail = await Promise.all(
        transactions.map(async (tx) => {
          const user = await storage.getUserById(tx.userId);
          return {
            ...tx,
            email: user?.email || "Unknown",
          };
        })
      );

      res.json(transactionsWithEmail);
    } catch (error) {
      console.error("Get admin transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Approve withdrawal (admin only)
  app.post("/api/admin/transactions/:id/approve", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transactions = await storage.getAllTransactions();
      const transaction = transactions.find(t => t.id === transactionId);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction is not pending" });
      }

      // Update transaction status
      await storage.updateTransactionStatus(transactionId, "completed");

      // Deduct from user balance
      const wallet = await storage.getWalletByUserId(transaction.userId);
      if (wallet) {
        await storage.updateWalletBalance(
          transaction.userId,
          wallet.totalBalanceUsd - transaction.amountUsd,
          wallet.availableBalanceUsd - transaction.amountUsd
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Approve withdrawal error:", error);
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
  });

  // Reject withdrawal (admin only)
  app.post("/api/admin/transactions/:id/reject", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      await storage.updateTransactionStatus(transactionId, "rejected");
      res.json({ success: true });
    } catch (error) {
      console.error("Reject withdrawal error:", error);
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  });

  // Adjust user balance (admin only)
  app.post("/api/admin/users/:id/adjust-balance", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const validatedData = insertAdminAdjustmentSchema.parse({
        userId,
        deltaBalanceUsd: req.body.deltaBalanceUsd,
        note: req.body.note,
      });

      // Create adjustment record
      await storage.createAdminAdjustment(validatedData);

      // Update wallet balance
      const wallet = await storage.getWalletByUserId(userId);
      if (wallet) {
        const newTotal = wallet.totalBalanceUsd + validatedData.deltaBalanceUsd;
        const newAvailable = wallet.availableBalanceUsd + validatedData.deltaBalanceUsd;
        await storage.updateWalletBalance(userId, newTotal, newAvailable);
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Adjust balance error:", error);
      res.status(500).json({ error: "Failed to adjust balance" });
    }
  });

  // ============ NowPayments Integration ============
  
  // Create deposit payment (scaffolded for NowPayments)
  app.post("/api/deposit/create", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { amountUsd, payCurrency } = req.body;

      // This is where you would integrate with NowPayments API
      // For now, return a mock payment address
      const mockPaymentData = {
        paymentId: `payment_${Date.now()}`,
        payAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        payAmount: amountUsd / 43000, // Mock BTC amount
        payCurrency,
        priceAmount: amountUsd,
        priceCurrency: "usd",
        status: "waiting",
      };

      // Create pending deposit transaction
      await storage.createTransaction({
        userId: req.userId!,
        type: "deposit",
        amountUsd,
        destinationAddress: null,
      });

      res.json(mockPaymentData);
    } catch (error) {
      console.error("Create deposit error:", error);
      res.status(500).json({ error: "Failed to create deposit" });
    }
  });

  // NowPayments IPN callback (webhook endpoint)
  app.post("/api/nowpayments/ipn", async (req, res) => {
    try {
      // In production, verify the IPN signature here
      const payment = req.body;

      if (payment.payment_status === "finished") {
        // Find the transaction and update user balance
        // This is simplified - in production you'd match by payment_id
        console.log("Payment received:", payment);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("IPN error:", error);
      res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

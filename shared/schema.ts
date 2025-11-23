import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  totalBalanceUsd: real("total_balance_usd").notNull().default(0),
  availableBalanceUsd: real("available_balance_usd").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const portfolioPositions = sqliteTable("portfolio_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  assetSymbol: text("asset_symbol").notNull(),
  averageEntryPrice: real("average_entry_price").notNull(),
  quantity: real("quantity").notNull(),
  currentValueUsd: real("current_value_usd").notNull(),
  profitLossUsd: real("profit_loss_usd").notNull(),
  profitLossPercent: real("profit_loss_percent").notNull(),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // deposit, withdrawal, trade, adjustment
  amountUsd: real("amount_usd").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, rejected
  txHashOrReference: text("tx_hash_or_reference"),
  destinationAddress: text("destination_address"),
  // NOWPayments specific fields
  cryptoCurrency: text("crypto_currency"), // USDT, BTC, ETH, USDC
  cryptoAmount: real("crypto_amount"),
  paymentProvider: text("payment_provider"), // nowpayments
  paymentId: text("payment_id"), // NOWPayments payment_id
  orderId: text("order_id"), // Internal order ID
  rawIpnData: text("raw_ipn_data"), // JSON blob for debugging
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const adminAdjustments = sqliteTable("admin_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  deltaBalanceUsd: real("delta_balance_usd").notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const arbitragePositions = sqliteTable("arbitrage_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  assetSymbol: text("asset_symbol").notNull(), // SOL, BTC, ETH, etc.
  entryExchange: text("entry_exchange").notNull(), // Kraken, Binance, etc.
  exitExchange: text("exit_exchange").notNull(),
  entryPrice: real("entry_price").notNull(), // USD
  exitPrice: real("exit_price"), // USD - nullable until closed
  quantity: real("quantity").notNull(),
  notionalValueUsd: real("notional_value_usd").notNull(), // entry_price * quantity
  rawPnlUsd: real("raw_pnl_usd"), // (exit_price - entry_price) * quantity - calculated at close
  rawPnlPercent: real("raw_pnl_percent"), // calculated at close
  overridePnlUsd: real("override_pnl_usd"), // Admin can set any value
  overridePnlPercent: real("override_pnl_percent"),
  finalPnlUsd: real("final_pnl_usd"), // Used in UI (override if present, else raw)
  finalPnlPercent: real("final_pnl_percent"),
  status: text("status").notNull().default("open"), // open, closed
  details: text("details"), // Optional JSON or notes
  openedAt: integer("opened_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioPositionSchema = createInsertSchema(portfolioPositions).omit({
  id: true,
  lastUpdated: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  status: true,
  txHashOrReference: true,
}).extend({
  amountUsd: z.number().positive("Amount must be positive"),
  type: z.enum(["deposit", "withdrawal", "trade", "adjustment"]),
});

export const insertAdminAdjustmentSchema = createInsertSchema(adminAdjustments).omit({
  id: true,
  createdAt: true,
});

export const insertArbitragePositionSchema = createInsertSchema(arbitragePositions).omit({
  id: true,
  openedAt: true,
  closedAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type InsertPortfolioPosition = z.infer<typeof insertPortfolioPositionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AdminAdjustment = typeof adminAdjustments.$inferSelect;
export type InsertAdminAdjustment = z.infer<typeof insertAdminAdjustmentSchema>;
export type ArbitragePosition = typeof arbitragePositions.$inferSelect;
export type InsertArbitragePosition = z.infer<typeof insertArbitragePositionSchema>;

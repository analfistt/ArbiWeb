import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import type {
  User, InsertUser,
  Wallet, InsertWallet,
  PortfolioPosition, InsertPortfolioPosition,
  Transaction, InsertTransaction,
  AdminAdjustment, InsertAdminAdjustment
} from "@shared/schema";

const db = new Database("database.db");

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_balance_usd REAL NOT NULL DEFAULT 0,
    available_balance_usd REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS portfolio_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    asset_symbol TEXT NOT NULL,
    average_entry_price REAL NOT NULL,
    quantity REAL NOT NULL,
    current_value_usd REAL NOT NULL,
    profit_loss_usd REAL NOT NULL,
    profit_loss_percent REAL NOT NULL,
    last_updated INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    tx_hash_or_reference TEXT,
    destination_address TEXT,
    crypto_currency TEXT,
    crypto_amount REAL,
    payment_provider TEXT,
    payment_id TEXT,
    order_id TEXT,
    raw_ipn_data TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    delta_balance_usd REAL NOT NULL,
    note TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed admin account if it doesn't exist
const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@site.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("Admin123!", 10);
  const insertAdmin = db.prepare(`
    INSERT INTO users (email, password, is_admin) VALUES (?, ?, 1)
  `);
  const result = insertAdmin.run("admin@site.com", hashedPassword);
  
  // Create wallet for admin
  db.prepare(`
    INSERT INTO wallets (user_id, total_balance_usd, available_balance_usd) VALUES (?, 0, 0)
  `).run(result.lastInsertRowid);
  
  console.log("✅ Admin account seeded: admin@site.com / Admin123!");
}

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Wallet methods
  getWalletByUserId(userId: number): Promise<Wallet | undefined>;
  updateWalletBalance(userId: number, totalBalance: number, availableBalance: number): Promise<void>;

  // Portfolio methods
  getPortfolioPositions(userId: number): Promise<PortfolioPosition[]>;
  createPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition>;
  updatePortfolioPosition(id: number, updates: Partial<PortfolioPosition>): Promise<void>;

  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionByPaymentId(paymentId: string): Promise<Transaction | undefined>;
  getTransactionByOrderId(orderId: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  updateTransactionWithIpnData(id: number, updates: Partial<Transaction>): Promise<void>;

  // Admin methods
  createAdminAdjustment(adjustment: InsertAdminAdjustment): Promise<AdminAdjustment>;
  getAdminAdjustmentsByUserId(userId: number): Promise<AdminAdjustment[]>;
}

export class SQLiteStorage implements IStorage {
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = bcrypt.hashSync(insertUser.password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (email, password) VALUES (?, ?)
    `);
    const result = stmt.run(insertUser.email, hashedPassword);
    const userId = result.lastInsertRowid as number;

    // Create wallet for new user
    db.prepare(`
      INSERT INTO wallets (user_id, total_balance_usd, available_balance_usd) VALUES (?, 0, 0)
    `).run(userId);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      isAdmin: Boolean(user.is_admin),
      createdAt: new Date(user.created_at * 1000),
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      isAdmin: Boolean(user.is_admin),
      createdAt: new Date(user.created_at * 1000),
    };
  }

  async getUserById(id: number): Promise<User | undefined> {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      isAdmin: Boolean(user.is_admin),
      createdAt: new Date(user.created_at * 1000),
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = db.prepare("SELECT * FROM users").all() as any[];
    return users.map(user => ({
      id: user.id,
      email: user.email,
      password: user.password,
      isAdmin: Boolean(user.is_admin),
      createdAt: new Date(user.created_at * 1000),
    }));
  }

  // Wallet methods
  async getWalletByUserId(userId: number): Promise<Wallet | undefined> {
    const wallet = db.prepare("SELECT * FROM wallets WHERE user_id = ?").get(userId) as any;
    if (!wallet) return undefined;
    return {
      id: wallet.id,
      userId: wallet.user_id,
      totalBalanceUsd: wallet.total_balance_usd,
      availableBalanceUsd: wallet.available_balance_usd,
      createdAt: new Date(wallet.created_at * 1000),
      updatedAt: new Date(wallet.updated_at * 1000),
    };
  }

  async updateWalletBalance(userId: number, totalBalance: number, availableBalance: number): Promise<void> {
    db.prepare(`
      UPDATE wallets 
      SET total_balance_usd = ?, available_balance_usd = ?, updated_at = unixepoch()
      WHERE user_id = ?
    `).run(totalBalance, availableBalance, userId);
  }

  // Portfolio methods
  async getPortfolioPositions(userId: number): Promise<PortfolioPosition[]> {
    const positions = db.prepare("SELECT * FROM portfolio_positions WHERE user_id = ?").all(userId) as any[];
    return positions.map(pos => ({
      id: pos.id,
      userId: pos.user_id,
      assetSymbol: pos.asset_symbol,
      averageEntryPrice: pos.average_entry_price,
      quantity: pos.quantity,
      currentValueUsd: pos.current_value_usd,
      profitLossUsd: pos.profit_loss_usd,
      profitLossPercent: pos.profit_loss_percent,
      lastUpdated: new Date(pos.last_updated * 1000),
    }));
  }

  async createPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition> {
    const stmt = db.prepare(`
      INSERT INTO portfolio_positions (
        user_id, asset_symbol, average_entry_price, quantity,
        current_value_usd, profit_loss_usd, profit_loss_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      position.userId,
      position.assetSymbol,
      position.averageEntryPrice,
      position.quantity,
      position.currentValueUsd,
      position.profitLossUsd,
      position.profitLossPercent
    );
    const pos = db.prepare("SELECT * FROM portfolio_positions WHERE id = ?").get(result.lastInsertRowid) as any;
    return {
      id: pos.id,
      userId: pos.user_id,
      assetSymbol: pos.asset_symbol,
      averageEntryPrice: pos.average_entry_price,
      quantity: pos.quantity,
      currentValueUsd: pos.current_value_usd,
      profitLossUsd: pos.profit_loss_usd,
      profitLossPercent: pos.profit_loss_percent,
      lastUpdated: new Date(pos.last_updated * 1000),
    };
  }

  async updatePortfolioPosition(id: number, updates: Partial<PortfolioPosition>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.currentValueUsd !== undefined) {
      fields.push("current_value_usd = ?");
      values.push(updates.currentValueUsd);
    }
    if (updates.profitLossUsd !== undefined) {
      fields.push("profit_loss_usd = ?");
      values.push(updates.profitLossUsd);
    }
    if (updates.profitLossPercent !== undefined) {
      fields.push("profit_loss_percent = ?");
      values.push(updates.profitLossPercent);
    }

    if (fields.length > 0) {
      fields.push("last_updated = unixepoch()");
      values.push(id);
      db.prepare(`UPDATE portfolio_positions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }
  }

  // Transaction methods
  async createTransaction(transaction: any): Promise<Transaction> {
    const stmt = db.prepare(`
      INSERT INTO transactions (
        user_id, type, amount_usd, destination_address,
        crypto_currency, crypto_amount, payment_provider, payment_id, order_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      transaction.userId,
      transaction.type,
      transaction.amountUsd,
      transaction.destinationAddress || null,
      transaction.cryptoCurrency || null,
      transaction.cryptoAmount || null,
      transaction.paymentProvider || null,
      transaction.paymentId || null,
      transaction.orderId || null
    );
    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid) as any;
    return this.mapTransaction(tx);
  }

  private mapTransaction(tx: any): Transaction {
    return {
      id: tx.id,
      userId: tx.user_id,
      type: tx.type,
      amountUsd: tx.amount_usd,
      status: tx.status,
      txHashOrReference: tx.tx_hash_or_reference,
      destinationAddress: tx.destination_address,
      cryptoCurrency: tx.crypto_currency,
      cryptoAmount: tx.crypto_amount,
      paymentProvider: tx.payment_provider,
      paymentId: tx.payment_id,
      orderId: tx.order_id,
      rawIpnData: tx.raw_ipn_data,
      createdAt: new Date(tx.created_at * 1000),
    };
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[];
    return transactions.map(tx => this.mapTransaction(tx));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC").all() as any[];
    return transactions.map(tx => this.mapTransaction(tx));
  }

  async getTransactionByPaymentId(paymentId: string): Promise<Transaction | undefined> {
    const tx = db.prepare("SELECT * FROM transactions WHERE payment_id = ?").get(paymentId) as any;
    if (!tx) return undefined;
    return this.mapTransaction(tx);
  }

  async getTransactionByOrderId(orderId: string): Promise<Transaction | undefined> {
    const tx = db.prepare("SELECT * FROM transactions WHERE order_id = ?").get(orderId) as any;
    if (!tx) return undefined;
    return this.mapTransaction(tx);
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(status, id);
  }

  async updateTransactionWithIpnData(id: number, updates: Partial<Transaction>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.txHashOrReference !== undefined) {
      fields.push("tx_hash_or_reference = ?");
      values.push(updates.txHashOrReference);
    }
    if (updates.cryptoAmount !== undefined) {
      fields.push("crypto_amount = ?");
      values.push(updates.cryptoAmount);
    }
    if (updates.rawIpnData !== undefined) {
      fields.push("raw_ipn_data = ?");
      values.push(updates.rawIpnData);
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }
  }

  // Admin methods
  async createAdminAdjustment(adjustment: InsertAdminAdjustment): Promise<AdminAdjustment> {
    const stmt = db.prepare(`
      INSERT INTO admin_adjustments (user_id, delta_balance_usd, note)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(adjustment.userId, adjustment.deltaBalanceUsd, adjustment.note || null);
    const adj = db.prepare("SELECT * FROM admin_adjustments WHERE id = ?").get(result.lastInsertRowid) as any;
    return {
      id: adj.id,
      userId: adj.user_id,
      deltaBalanceUsd: adj.delta_balance_usd,
      note: adj.note,
      createdAt: new Date(adj.created_at * 1000),
    };
  }

  async getAdminAdjustmentsByUserId(userId: number): Promise<AdminAdjustment[]> {
    const adjustments = db.prepare("SELECT * FROM admin_adjustments WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[];
    return adjustments.map(adj => ({
      id: adj.id,
      userId: adj.user_id,
      deltaBalanceUsd: adj.delta_balance_usd,
      note: adj.note,
      createdAt: new Date(adj.created_at * 1000),
    }));
  }
}

export const storage = new SQLiteStorage();

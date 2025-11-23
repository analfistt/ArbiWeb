import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import config from "./config";
import type { Transaction } from "@shared/schema";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  email?: string;
  isAdmin?: boolean;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();
  private adminClients: Set<AuthenticatedWebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
      console.log("📡 New WebSocket connection attempt");

      // Extract token from query string or headers
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get("token") || req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        console.log("❌ WebSocket connection rejected: No token");
        ws.close(1008, "Unauthorized");
        return;
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        ws.userId = decoded.userId;
        ws.email = decoded.email;
        ws.isAdmin = decoded.isAdmin;
        ws.isAlive = true;

        console.log(`✅ WebSocket authenticated: user ${ws.userId} (${ws.email}) ${ws.isAdmin ? '[ADMIN]' : ''}`);

        // Add to appropriate rooms
        if (ws.isAdmin) {
          this.adminClients.add(ws);
        }

        if (!this.clients.has(ws.userId!)) {
          this.clients.set(ws.userId!, new Set());
        }
        this.clients.get(ws.userId!)!.add(ws);

        // Set up ping/pong for keep-alive
        ws.on("pong", () => {
          ws.isAlive = true;
        });

        // Handle incoming messages
        ws.on("message", (data) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            this.handleMessage(ws, message);
          } catch (error) {
            console.error("❌ WebSocket message parse error:", error);
          }
        });

        // Handle disconnection
        ws.on("close", () => {
          console.log(`🔌 WebSocket disconnected: user ${ws.userId}`);
          this.removeClient(ws);
        });

        // Send welcome message
        this.sendToClient(ws, {
          type: "connected",
          payload: {
            userId: ws.userId,
            isAdmin: ws.isAdmin,
            message: "WebSocket connected successfully",
          },
        });
      } catch (error) {
        console.error("❌ WebSocket auth error:", error);
        ws.close(1008, "Invalid token");
      }
    });

    // Set up heartbeat interval
    const heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`💔 Terminating inactive WebSocket: user ${ws.userId}`);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on("close", () => {
      clearInterval(heartbeatInterval);
    });

    console.log("✅ WebSocket server initialized");
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    console.log(`📨 WebSocket message from user ${ws.userId}:`, message.type);

    switch (message.type) {
      case "ping":
        this.sendToClient(ws, { type: "pong", payload: { timestamp: Date.now() } });
        break;
      
      case "subscribe":
        // Handle subscription requests if needed
        break;

      default:
        console.warn(`⚠️  Unknown WebSocket message type: ${message.type}`);
    }
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }

    if (ws.isAdmin) {
      this.adminClients.delete(ws);
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send message to a specific user (all their active connections)
   */
  emitToUser(userId: number, eventType: string, payload: any) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`📭 No active WebSocket connections for user ${userId}`);
      return;
    }

    const message: WebSocketMessage = {
      type: eventType,
      payload,
    };

    userClients.forEach((ws) => {
      this.sendToClient(ws, message);
    });

    console.log(`📤 Sent ${eventType} to user ${userId} (${userClients.size} connection(s))`);
  }

  /**
   * Send message to all admin users
   */
  emitToAdmins(eventType: string, payload: any) {
    if (this.adminClients.size === 0) {
      console.log("📭 No active admin WebSocket connections");
      return;
    }

    const message: WebSocketMessage = {
      type: eventType,
      payload,
    };

    this.adminClients.forEach((ws) => {
      this.sendToClient(ws, message);
    });

    console.log(`📤 Sent ${eventType} to admins (${this.adminClients.size} connection(s))`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(eventType: string, payload: any) {
    const message: WebSocketMessage = {
      type: eventType,
      payload,
    };

    this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
      this.sendToClient(ws, message);
    });

    console.log(`📡 Broadcast ${eventType} to all clients`);
  }

  /**
   * Emit deposit update to user and admins
   */
  emitDepositUpdate(transaction: Transaction, newBalance: number) {
    // Notify the user
    this.emitToUser(transaction.userId, "deposit_updated", {
      transactionId: transaction.id,
      status: transaction.status,
      amountUsd: transaction.amountUsd,
      cryptoCurrency: transaction.cryptoCurrency,
      cryptoAmount: transaction.cryptoAmount,
      newBalance,
      timestamp: new Date().toISOString(),
    });

    // Notify all admins
    this.emitToAdmins("admin_deposits_stream", {
      userId: transaction.userId,
      transactionId: transaction.id,
      type: transaction.type,
      amountUsd: transaction.amountUsd,
      cryptoCurrency: transaction.cryptoCurrency,
      cryptoAmount: transaction.cryptoAmount,
      status: transaction.status,
      paymentId: transaction.paymentId,
      orderId: transaction.orderId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      totalConnections: this.wss?.clients.size || 0,
      totalUsers: this.clients.size,
      adminConnections: this.adminClients.size,
    };
  }
}

export const wsManager = new WebSocketManager();

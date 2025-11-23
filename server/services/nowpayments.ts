import crypto from "crypto";
import config from "../config";

export interface CreatePaymentParams {
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId: string;
  ipnCallbackUrl: string;
  orderDescription?: string;
}

export interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  amount_received?: number;
  payin_extra_id?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: string;
  burning_percent?: number;
  expiration_estimate_date?: string;
}

export interface IPNPayload {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  [key: string]: any;
}

class NOWPaymentsService {
  private apiUrl: string;
  private apiKey: string;
  private ipnSecret: string;

  constructor() {
    this.apiUrl = config.nowPayments.apiUrl;
    this.apiKey = config.nowPayments.apiKey;
    this.ipnSecret = config.nowPayments.ipnSecret;
  }

  /**
   * Create a payment request with NOWPayments
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    // If no API key (demo mode), return mock data
    if (!this.apiKey) {
      console.log("📝 NOWPayments demo mode - returning mock payment data");
      return this.createMockPayment(params);
    }

    try {
      const response = await fetch(`${this.apiUrl}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`NOWPayments API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log("✅ NOWPayments payment created:", data.payment_id);
      return data;
    } catch (error) {
      console.error("❌ NOWPayments create payment error:", error);
      throw error;
    }
  }

  /**
   * Verify IPN callback signature
   */
  verifyIPN(payload: string, signature: string): boolean {
    if (!this.ipnSecret) {
      console.warn("⚠️  NOWPayments IPN secret not set - skipping signature verification");
      return true; // In demo mode, accept all IPNs
    }

    const hmac = crypto.createHmac("sha512", this.ipnSecret);
    const expectedSignature = hmac.update(payload).digest("hex");
    
    return expectedSignature === signature;
  }

  /**
   * Get payment status from NOWPayments API
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    if (!this.apiKey) {
      console.log("📝 NOWPayments demo mode - returning mock status");
      return { payment_status: "waiting" };
    }

    try {
      const response = await fetch(`${this.apiUrl}/payment/${paymentId}`, {
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get payment status");
      }

      return await response.json();
    } catch (error) {
      console.error("❌ NOWPayments get payment status error:", error);
      throw error;
    }
  }

  /**
   * Create mock payment for demo/testing purposes
   */
  private createMockPayment(params: CreatePaymentParams): PaymentResponse {
    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate realistic crypto addresses based on currency
    const addresses: Record<string, string> = {
      btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      eth: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
      usdt: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7", // ERC20
      usdc: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7", // ERC20
    };

    // Mock exchange rates (approximate)
    const exchangeRates: Record<string, number> = {
      btc: 43000,
      eth: 2300,
      usdt: 1,
      usdc: 1,
    };

    const rate = exchangeRates[params.payCurrency.toLowerCase()] || 1;
    const payAmount = params.priceAmount / rate;

    return {
      payment_id: paymentId,
      payment_status: "waiting",
      pay_address: addresses[params.payCurrency.toLowerCase()] || addresses.btc,
      pay_amount: payAmount,
      pay_currency: params.payCurrency,
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription || "",
      ipn_callback_url: params.ipnCallbackUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      purchase_id: paymentId,
      network: params.payCurrency.toLowerCase() === "btc" ? "btc" : "eth",
      time_limit: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };
  }
}

export const nowPaymentsService = new NOWPaymentsService();

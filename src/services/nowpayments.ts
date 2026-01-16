// NowPayments.io Payment Service
import { NOWPAYMENTS_CONFIG } from "@/config/nowpayments";

export interface PaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string; // Optional: specific cryptocurrency (e.g., "USDT", "BTC", "ETH"). If not provided, user can choose
  order_id: string;
  order_description: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  payment_url?: string;
}

export interface PaymentStatus {
  payment_id: number;
  payment_status: "waiting" | "confirming" | "confirmed" | "sending" | "partially_paid" | "finished" | "failed" | "refunded" | "expired";
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
}

class NowPaymentsService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = NOWPAYMENTS_CONFIG.API_KEY;
    this.apiUrl = NOWPAYMENTS_CONFIG.API_URL;
  }

  /**
   * Create a payment invoice
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Ensure IPN callback URL is provided (required by NowPayments)
      const ipnUrl = request.ipn_callback_url || NOWPAYMENTS_CONFIG.IPN_URL;
      
      if (!ipnUrl || ipnUrl.trim() === "") {
        throw new Error("IPN callback URL is required. Please configure VITE_IPN_URL environment variable or set up a webhook endpoint.");
      }

      // Validate URLs are properly formatted
      const validateUrl = (url: string | undefined, name: string) => {
        if (!url) return;
        try {
          new URL(url);
        } catch {
          throw new Error(`${name} must be a valid URL`);
        }
      };

      validateUrl(request.success_url, "success_url");
      validateUrl(request.cancel_url, "cancel_url");
      validateUrl(ipnUrl, "ipn_callback_url");

      // Build request body - only include pay_currency if provided
      const requestBody: any = {
        price_amount: request.price_amount,
        price_currency: request.price_currency,
        order_id: request.order_id,
        order_description: request.order_description,
        ipn_callback_url: ipnUrl, // Required: cannot be empty
        success_url: request.success_url,
        cancel_url: request.cancel_url,
      };

      // pay_currency is required by NowPayments API
      if (!request.pay_currency) {
        throw new Error("pay_currency is required. Please specify a cryptocurrency.");
      }
      requestBody.pay_currency = request.pay_currency;

      const response = await fetch(`${this.apiUrl}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payment");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("NowPayments createPayment error:", error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: number): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/payment/${paymentId}`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get payment status");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("NowPayments getPaymentStatus error:", error);
      throw error;
    }
  }

  /**
   * Get available currencies
   */
  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/currencies`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get currencies");
      }

      const data = await response.json();
      return data.currencies || [];
    } catch (error) {
      console.error("NowPayments getAvailableCurrencies error:", error);
      return [];
    }
  }

  /**
   * Get estimated price in cryptocurrency
   */
  async getEstimatedPrice(
    amount: number,
    currencyFrom: string,
    currencyTo: string
  ): Promise<number> {
    try {
      const response = await fetch(
        `${this.apiUrl}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
        {
          method: "GET",
          headers: {
            "x-api-key": this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get estimated price");
      }

      const data = await response.json();
      return data.estimated_amount || 0;
    } catch (error) {
      console.error("NowPayments getEstimatedPrice error:", error);
      throw error;
    }
  }
}

export const nowPaymentsService = new NowPaymentsService();

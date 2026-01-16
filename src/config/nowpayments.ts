// NowPayments.io Configuration
// Replace these with your actual API keys from NowPayments.io dashboard

export const NOWPAYMENTS_CONFIG = {
  // API Key (for server-side operations - keep secure)
  // In production, this should be stored in environment variables, not hardcoded
  API_KEY: import.meta.env.VITE_NOWPAYMENTS_API_KEY || "7HKW5FS-ZZEM8GW-QHT99D5-2K3YYH6",
  
  // Public Key (for client-side operations)
  PUBLIC_KEY: import.meta.env.VITE_NOWPAYMENTS_PUBLIC_KEY || "98260cca-688a-4738-8e65-dc4bebe127c1",
  
  // API Base URL
  API_URL: "https://api.nowpayments.io/v1",
  
  // Payment widget URL (for redirect-based payments)
  PAYMENT_URL: "https://nowpayments.io/payment",
  
  // Your IPN (Instant Payment Notification) URL - update with your backend URL
  // For now, using a placeholder URL. In production, set up a backend webhook endpoint
  IPN_URL: import.meta.env.VITE_IPN_URL || (typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/nowpayments` : "https://yourdomain.com/api/webhooks/nowpayments"),
  
  // IPN Secret Key (for verifying webhook signatures)
  IPN_SECRET_KEY: import.meta.env.VITE_NOWPAYMENTS_IPN_KEY || "wzjduTFUPsPnmK37w9YBytSCBfibSGj0",
};

// Validate configuration
export const isNowPaymentsConfigured = (): boolean => {
  return !!(NOWPAYMENTS_CONFIG.API_KEY && NOWPAYMENTS_CONFIG.PUBLIC_KEY);
};

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, X, ExternalLink, CheckCircle2, AlertCircle, Copy, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { nowPaymentsService, PaymentResponse } from "@/services/nowpayments";
import { formatCurrency, lkrToUsd, lkrToUsdSync, getExchangeRate } from "@/utils/currency";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  orderDescription: string;
  onSuccess: (paymentId: number) => void;
  onError: (error: string) => void;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  amount,
  orderId,
  orderDescription,
  onSuccess,
  onError,
}: PaymentModalProps) => {
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(300); // Default rate
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [availableCurrency, setAvailableCurrency] = useState<string>("USDT"); // Default currency
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !payment && !isCreating) {
      // Reset state when modal opens
      setPayment(null);
      setError(null);
      
      // Fetch exchange rate and available currencies
      Promise.all([
        getExchangeRate(),
        nowPaymentsService.getAvailableCurrencies()
      ]).then(([rate, currencies]) => {
        setExchangeRate(rate);
        const usd = lkrToUsdSync(amount, rate);
        setUsdAmount(usd);
        
        // Find a suitable currency (prefer USDT, USDC, or first available)
        const preferredCurrencies = ["USDT", "USDC", "BTC", "ETH"];
        const selectedCurrency = preferredCurrencies.find(c => currencies.includes(c)) || currencies[0] || "USDT";
        setAvailableCurrency(selectedCurrency);
        
        // For USDT, always use BEP20 (USDTBSC)
        // For other currencies, use directly
        createPayment(usd, selectedCurrency);
      }).catch((err) => {
        console.error("Error initializing payment:", err);
        // Fallback to default rate and currency if fetch fails
        const usd = lkrToUsdSync(amount, 300);
        setUsdAmount(usd);
        createPayment(usd, "USDT");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const createPayment = async (usdValue: number, payCurrency: string) => {
    setIsCreating(true);
    setError(null);

    try {
      // Build valid URLs for success and cancel callbacks
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/purchase?success=true`;
      const cancelUrl = `${baseUrl}/purchase?cancel=true`;

      // For USDT, always use BEP20 (USDTBSC)
      let finalPayCurrency = payCurrency;
      if (payCurrency === "USDT") {
        finalPayCurrency = "USDTBSC"; // Always use BEP20
      }

      // pay_currency is required by NowPayments API
      const paymentResponse = await nowPaymentsService.createPayment({
        price_amount: usdValue, // Converted to USD
        price_currency: "USD", // NowPayments supports USD
        pay_currency: finalPayCurrency, // Required: use available currency with network
        order_id: orderId,
        order_description: orderDescription,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      
      setPayment(paymentResponse);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create payment";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePayment = () => {
    if (payment?.payment_url) {
      // Open payment page in new window
      window.open(payment.payment_url, "_blank");
      
      // Start polling for payment status
      pollPaymentStatus(payment.payment_id);
    }
  };

  const pollPaymentStatus = async (paymentId: number) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (5 second intervals)
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const status = await nowPaymentsService.getPaymentStatus(paymentId);
        
        if (status.payment_status === "finished" || status.payment_status === "confirmed") {
          clearInterval(interval);
          onSuccess(paymentId);
          onClose();
        } else if (
          status.payment_status === "failed" ||
          status.payment_status === "expired" ||
          status.payment_status === "refunded"
        ) {
          clearInterval(interval);
          onError(`Payment ${status.payment_status}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          onError("Payment timeout. Please check your payment status.");
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          onError("Failed to verify payment status");
        }
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-foreground">
              Complete Payment
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {isCreating && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Creating payment...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {payment && !error && (
              <>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Amount (LKR)</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Amount (USD)</span>
                    <span className="text-sm font-medium text-foreground">
                      ${usdAmount > 0 ? usdAmount.toFixed(2) : lkrToUsdSync(amount, exchangeRate).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 text-center space-y-1">
                    <div>Exchange Rate: 1 USD = {exchangeRate.toFixed(2)} LKR</div>
                    {availableCurrency && <div>Payment Currency: {availableCurrency}</div>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order ID</span>
                    <span className="text-sm font-mono text-foreground">{orderId}</span>
                  </div>
                </div>

                {/* Payment Address Section - BEP20 USDT Address with QR Code */}
                {payment.pay_address && (
                  <div className="p-4 rounded-lg bg-card border-2 border-primary/20 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">BEP20 Payment Address</h3>
                    </div>
                    
                    {/* QR Code */}
                    <div className="flex justify-center p-4 bg-white rounded-lg border border-border">
                      <QRCodeSVG
                        value={payment.pay_address}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 text-center">
                        Send <span className="font-bold text-foreground">{payment.pay_amount} {payment.pay_currency}</span> to:
                      </p>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
                        <code className="flex-1 text-xs font-mono text-foreground break-all">
                          {payment.pay_address}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(payment.pay_address);
                            toast({
                              title: "Copied!",
                              description: "Payment address copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground text-center">
                      <p className="font-medium mb-1">Payment Network:</p>
                      <p className="text-foreground">BEP20 (Binance Smart Chain)</p>
                    </div>

                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs text-warning font-medium text-center">
                        ⚠️ Important: Send exactly {payment.pay_amount} {payment.pay_currency} to this address
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {payment.payment_url ? (
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handlePayment}
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Open Payment Page
                    </Button>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">
                        Use the address above to send your payment
                      </p>
                    </div>
                  )}
                  <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
                    Close
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Payment will be confirmed automatically once received
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

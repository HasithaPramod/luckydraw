import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Wallet, DollarSign, TrendingUp, AlertCircle, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { nowPaymentsService, PaymentResponse } from "@/services/nowpayments";
import { formatCurrency, getExchangeRate, usdToLkr } from "@/utils/currency";
import { AgentWalletManager } from "@/utils/agentWallet";
import { useToast } from "@/hooks/use-toast";

interface AgentWalletTopupProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  onSuccess: () => void;
}

const MINIMUM_TOPUP_USD = 10; // Minimum $10 top-up

export const AgentWalletTopup = ({
  isOpen,
  onClose,
  agentId,
  onSuccess,
}: AgentWalletTopupProps) => {
  const [usdAmount, setUsdAmount] = useState<string>("10");
  const [lkrAmount, setLkrAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(300);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const { toast } = useToast();

  // Fetch exchange rate and calculate LKR amount
  useEffect(() => {
    if (isOpen) {
      loadExchangeRate();
    }
  }, [isOpen]);

  useEffect(() => {
    if (usdAmount && exchangeRate) {
      const usd = parseFloat(usdAmount) || 0;
      const lkr = usd * exchangeRate;
      setLkrAmount(lkr);
    }
  }, [usdAmount, exchangeRate]);

  const loadExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const rate = await getExchangeRate();
      setExchangeRate(rate);
    } catch (error) {
      console.error("Error loading exchange rate:", error);
      toast({
        title: "Exchange Rate Error",
        description: "Using default rate. Please refresh.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleCreatePayment = async () => {
    const amount = parseFloat(usdAmount);
    
    // Validate minimum amount
    if (isNaN(amount) || amount < MINIMUM_TOPUP_USD) {
      setError(`Minimum top-up amount is $${MINIMUM_TOPUP_USD}`);
      toast({
        title: "Invalid Amount",
        description: `Minimum top-up amount is $${MINIMUM_TOPUP_USD}`,
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const orderId = `agent_topup_${agentId}_${Date.now()}`;
      const orderDescription = `Agent Wallet Top-up - $${amount.toFixed(2)} USD`;

      // Create payment with NowPayments
      const paymentResponse = await nowPaymentsService.createPayment({
        price_amount: amount,
        price_currency: "USD",
        pay_currency: "USDTBSC", // Use BEP20 USDT
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: `${window.location.origin}/api/webhooks/agent-topup`,
        success_url: `${window.location.origin}/agent?topup=success`,
        cancel_url: `${window.location.origin}/agent?topup=cancelled`,
      });

      setPayment(paymentResponse);
      
      // Store payment info for IPN callback
      localStorage.setItem(`topup_${paymentResponse.payment_id}`, JSON.stringify({
        agentId,
        usdAmount: amount,
        lkrAmount,
        exchangeRate,
        timestamp: Date.now(),
      }));

      // Start polling for payment status
      pollPaymentStatus(paymentResponse.payment_id);
    } catch (error: any) {
      console.error("Payment creation error:", error);
      setError(error.message || "Failed to create payment");
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const pollPaymentStatus = async (paymentId: number) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (5 second intervals)
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const status = await nowPaymentsService.getPaymentStatus(paymentId);
        setPaymentStatus(status.payment_status);

        if (status.payment_status === "finished" || status.payment_status === "confirmed") {
          clearInterval(interval);
          
          // Payment successful - add funds to wallet
          const topupData = localStorage.getItem(`topup_${paymentId}`);
          if (topupData) {
            const data = JSON.parse(topupData);
            const actualPaidUsd = status.actually_paid || status.outcome_amount || data.usdAmount;
            
            // Convert USD to LKR using the exchange rate at payment time
            const lkrToAdd = actualPaidUsd * data.exchangeRate;
            
            // Add funds to agent wallet
            AgentWalletManager.addFunds(
              agentId,
              lkrToAdd,
              `Top-up via NowPayments - $${actualPaidUsd.toFixed(2)} USD (Payment ID: ${paymentId})`
            );

            // Clean up
            localStorage.removeItem(`topup_${paymentId}`);
            
            toast({
              title: "Top-up Successful!",
              description: `${formatCurrency(lkrToAdd)} has been added to your wallet.`,
            });
            
            onSuccess();
            handleClose();
          }
        } else if (status.payment_status === "failed" || status.payment_status === "expired") {
          clearInterval(interval);
          setError("Payment failed or expired");
          toast({
            title: "Payment Failed",
            description: "Payment was not completed. Please try again.",
            variant: "destructive",
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Payment status check timeout. Please verify payment manually.");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleClose = () => {
    setPayment(null);
    setError(null);
    setPaymentStatus("");
    setUsdAmount("10");
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Top Up Wallet</h2>
                <p className="text-sm text-muted-foreground">Minimum: ${MINIMUM_TOPUP_USD} USD</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {!payment ? (
              <>
                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <div className="mt-2 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      min={MINIMUM_TOPUP_USD}
                      step="0.01"
                      value={usdAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = parseFloat(value);
                        if (value === "" || (num >= MINIMUM_TOPUP_USD)) {
                          setUsdAmount(value);
                        }
                      }}
                      className="pl-12"
                      placeholder={`${MINIMUM_TOPUP_USD}+`}
                    />
                  </div>
                  {parseFloat(usdAmount) < MINIMUM_TOPUP_USD && usdAmount !== "" && (
                    <p className="text-xs text-destructive mt-1">
                      Minimum amount is ${MINIMUM_TOPUP_USD}
                    </p>
                  )}
                </div>

                {/* Exchange Rate Display */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Exchange Rate</span>
                    {isLoadingRate ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadExchangeRate}
                        className="h-auto p-0 text-xs"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    1 USD = {exchangeRate.toFixed(2)} LKR
                  </p>
                  {lkrAmount > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You will receive: {formatCurrency(lkrAmount)}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Create Payment Button */}
                <Button
                  onClick={handleCreatePayment}
                  disabled={isCreating || parseFloat(usdAmount) < MINIMUM_TOPUP_USD || !usdAmount}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Payment Details */}
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Pay with BEP20 USDT</p>
                    <p className="text-2xl font-bold text-foreground">
                      {payment.pay_amount.toFixed(6)} {payment.pay_currency}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ ${payment.price_amount.toFixed(2)} USD
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-background rounded-xl border border-border">
                    <QRCodeSVG value={payment.pay_address} size={200} />
                  </div>

                  {/* Payment Address */}
                  <div>
                    <Label>BEP20 Payment Address</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={payment.pay_address}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(payment.pay_address)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Send exactly {payment.pay_amount.toFixed(6)} {payment.pay_currency} to this address
                    </p>
                  </div>

                  {/* Payment Status */}
                  {paymentStatus && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium text-foreground mb-1">Payment Status</p>
                      <p className="text-xs text-muted-foreground capitalize">{paymentStatus}</p>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Payment will be automatically credited to your wallet once confirmed on the blockchain.
                      This may take a few minutes.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

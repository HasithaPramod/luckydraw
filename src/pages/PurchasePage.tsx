import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { NumberGrid } from "@/components/NumberGrid";
import { PaymentModal } from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { NumberLockManager } from "@/utils/numberLockManager";
import { TicketManager, getCurrentDrawNumber } from "@/utils/ticketManager";
import { DrawManager } from "@/utils/drawManager";
import { formatCurrency } from "@/utils/currency";
import { isNowPaymentsConfigured } from "@/config/nowpayments";
import { ArrowLeft, Ticket, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PurchasePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [maxQuantity] = useState(10); // Maximum tickets per purchase
  const [step, setStep] = useState<"select" | "processing" | "success" | "error">("select");
  const [purchasedNumbers, setPurchasedNumbers] = useState<string[]>([]);
  const [currentDrawNumber, setCurrentDrawNumber] = useState<string>("");
  const [selectedDraw, setSelectedDraw] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string>("");
  const [pricePerTicket, setPricePerTicket] = useState<number>(500.0); // Default price

  // Load current draw and ticket price
  useEffect(() => {
    const loadDraw = () => {
      const currentDraw = DrawManager.getCurrentActiveDraw();
      if (currentDraw) {
        // Allow purchases for pending draws (regardless of result announcement date)
        // Only block if winning number is already set
        if (!currentDraw.winningNumber) {
          setPricePerTicket(currentDraw.ticketPrice || 500);
          setCurrentDrawNumber(currentDraw.drawNumber);
        } else {
          // Winning number is set, draw is closed
          toast({
            title: "Draw Closed",
            description: "This draw is closed. Please wait for a new draw.",
          });
          setPricePerTicket(500);
          setCurrentDrawNumber(getCurrentDrawNumber());
        }
      } else {
        // Fallback to default if no active draw
        setPricePerTicket(500);
        setCurrentDrawNumber(getCurrentDrawNumber());
      }
    };
    
    loadDraw();
    // Refresh every 5 seconds to check for new draws
    const interval = setInterval(loadDraw, 5000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleNumberSelect = (number: string) => {
    if (selectedNumbers.includes(number)) {
      // Deselect
      setSelectedNumbers(selectedNumbers.filter((n) => n !== number));
      if (user) {
        NumberLockManager.releaseNumber(number, user.id);
      }
    } else {
      // Select - allow up to maxQuantity
      if (selectedNumbers.length < maxQuantity) {
        setSelectedNumbers([...selectedNumbers, number]);
        // Lock the number when selected
        if (user) {
          NumberLockManager.lockNumber(number, user.id);
        }
      } else {
        toast({
          title: "Maximum Reached",
          description: `You can select up to ${maxQuantity} numbers per purchase.`,
          variant: "destructive",
        });
      }
    }
  };

  const handlePurchase = () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "No Numbers Selected",
        description: "Please select at least one number to purchase.",
        variant: "destructive",
      });
      return;
    }

    // Use selected draw or fallback to active draw
    const currentDraw = selectedDraw || DrawManager.getCurrentActiveDraw();
    if (!currentDraw) {
      toast({
        title: "No Active Draw",
        description: "There is no active draw available. Please wait for a new draw to be created.",
        variant: "destructive",
      });
      return;
    }

    // Check if result announcement date has passed and winning number is set
    const now = Date.now();
    if (currentDraw.resultAnnouncementDate && now >= currentDraw.resultAnnouncementDate && currentDraw.winningNumber) {
      toast({
        title: "Draw Closed",
        description: "This draw is closed. The winning number has been announced.",
        variant: "destructive",
      });
      return;
    }

    // Check ticket count (100 ticket limit)
    const ticketCount = DrawManager.getTicketCountForDraw(currentDraw.drawNumber);
    if (ticketCount >= 100) {
      toast({
        title: "Draw Full",
        description: "This draw has reached the maximum of 100 tickets. Please wait for the next draw.",
        variant: "destructive",
      });
      return;
    }

    // Check if selected numbers would exceed the limit
    if (ticketCount + selectedNumbers.length > 100) {
      toast({
        title: "Too Many Tickets",
        description: `Only ${100 - ticketCount} tickets remaining in this draw. Please select fewer numbers.`,
        variant: "destructive",
      });
      return;
    }

    // Check if NowPayments is configured
    if (!isNowPaymentsConfigured()) {
      // Fallback to demo mode if not configured
      handleDemoPurchase();
      return;
    }

    // Generate unique order ID
    const orderId = `ORDER_${user?.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPaymentOrderId(orderId);
    setShowPaymentModal(true);
  };

  const handleDemoPurchase = async () => {
    setStep("processing");

    try {
      // Simulate payment processing (80% success rate for demo)
      const paymentSuccess = Math.random() > 0.2;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (paymentSuccess && user) {
        await handlePaymentSuccess();
      } else {
        handlePaymentFailure("Payment simulation failed");
      }
    } catch (error) {
      handlePaymentFailure("An error occurred during payment");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user) return;

    try {
      // Payment successful - reserve numbers permanently
      NumberLockManager.reserveNumbers(selectedNumbers, user.id);
      
      // Create tickets with lucky numbers and draw number
      // Use the current draw number from state (which is the active pending draw)
      const drawNumber = currentDrawNumber || getCurrentDrawNumber();
      
      // Create tickets manually to ensure correct draw number
      const purchaseDate = Date.now();
      const newTickets = selectedNumbers.map((number, index) => ({
        id: `ticket_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        luckyNumbers: [number],
        drawNumber: drawNumber,
        purchaseDate,
        status: "active" as const,
        price: pricePerTicket,
      }));
      
      // Save tickets
      const existingTickets = TicketManager.getAllTickets();
      const updatedTickets = [...existingTickets, ...newTickets];
      localStorage.setItem("userTickets", JSON.stringify(updatedTickets));
      
      setPurchasedNumbers(selectedNumbers);
      setStep("success");
      setShowPaymentModal(false);
      
      toast({
        title: "Payment Successful",
        description: `${newTickets.length} ticket${newTickets.length > 1 ? "s" : ""} purchased successfully!`,
      });
    } catch (error) {
      console.error("Error processing payment success:", error);
      handlePaymentFailure("Failed to process payment success");
    }
  };

  const handlePaymentFailure = (errorMessage: string) => {
    // Payment failed - release numbers
    if (user) {
      NumberLockManager.releaseNumbers(selectedNumbers, user.id);
    }
    setStep("error");
    setShowPaymentModal(false);
    toast({
      title: "Payment Failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handlePaymentModalSuccess = (paymentId: number) => {
    console.log("Payment successful, payment ID:", paymentId);
    handlePaymentSuccess();
  };

  const handlePaymentModalError = (error: string) => {
    handlePaymentFailure(error);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold text-foreground">Buy Tickets</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Ticket Icon */}
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center shadow-glow"
                >
                  <Ticket className="w-12 h-12 text-primary-foreground" />
                </motion.div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Pick Your Lucky Numbers
                </h2>
                <p className="text-muted-foreground mt-2">
                  Select multiple numbers from 00-99 (up to {maxQuantity} tickets)
                </p>
                {currentDrawNumber && (() => {
                  const currentDraw = DrawManager.getCurrentActiveDraw();
                  if (currentDraw) {
                    const ticketCount = DrawManager.getTicketCountForDraw(currentDraw.drawNumber);
                    return (
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Current Draw:</span> {currentDrawNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ticket Price: {formatCurrency(pricePerTicket)} • Tickets Sold: {ticketCount} / 100
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Selection Summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedNumbers.length} Number{selectedNumbers.length !== 1 ? "s" : ""} Selected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedNumbers.length > 0 && (
                      <span>Selected: {selectedNumbers.sort((a, b) => parseInt(a) - parseInt(b)).join(", ")}</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(selectedNumbers.length * pricePerTicket)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(pricePerTicket)} per ticket
                  </p>
                </div>
              </div>

              {/* Number Grid */}
              <div className="max-h-[60vh] overflow-y-auto">
                <NumberGrid
                  selectedNumbers={selectedNumbers}
                  onNumberSelect={handleNumberSelect}
                  maxSelections={maxQuantity}
                />
              </div>

              {/* Purchase Button */}
              <div className="pt-4 sticky bottom-0 bg-background pb-4">
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={handlePurchase}
                  disabled={selectedNumbers.length === 0}
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  {selectedNumbers.length > 0 ? (
                    <>
                      Purchase {selectedNumbers.length} Ticket{selectedNumbers.length !== 1 ? "s" : ""} - {formatCurrency(selectedNumbers.length * pricePerTicket)}
                    </>
                  ) : (
                    "Select Numbers to Purchase"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  {selectedNumbers.length > 0 ? (
                    <>
                      Numbers locked for 5 minutes • Secure payment
                    </>
                  ) : (
                    "Click on numbers below to select your tickets"
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary"
              />
              <div className="text-center">
                <h2 className="text-xl font-display font-bold text-foreground">
                  Processing Payment
                </h2>
                <p className="text-muted-foreground mt-2">Please wait...</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Your selected numbers are locked during payment
                </p>
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="flex justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-16 h-16 text-destructive" />
                </div>
              </motion.div>

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your selected numbers have been released. Please try again.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setStep("select");
                    setSelectedNumbers([]);
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Go Back Home
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="flex justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-success" />
                </div>
              </motion.div>

              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Purchase Successful!
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your tickets have been added to your account
                </p>
              </div>

              {/* Draw Info */}
              {currentDrawNumber && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground">Draw Number</p>
                  <p className="text-lg font-bold text-primary mt-1">{currentDrawNumber}</p>
                </div>
              )}

              {/* Purchased Numbers */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Your Lucky Numbers
                </p>
                {purchasedNumbers.map((number, index) => (
                  <motion.div
                    key={number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-2xl glass-card border-2 border-success/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <span className="ticket-number text-lg text-foreground">#{number}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lucky Number: {number}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-success font-semibold">ACTIVE</span>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/tickets")}
                >
                  View All My Tickets
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setStep("select");
                    setSelectedNumbers([]);
                    setPurchasedNumbers([]);
                  }}
                >
                  Buy More Tickets
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            // Release numbers if user cancels
            if (user) {
              NumberLockManager.releaseNumbers(selectedNumbers, user.id);
            }
          }}
          amount={selectedNumbers.length * pricePerTicket}
          orderId={paymentOrderId}
          orderDescription={`Purchase of ${selectedNumbers.length} ticket${selectedNumbers.length > 1 ? "s" : ""} - Numbers: ${selectedNumbers.join(", ")}`}
          onSuccess={handlePaymentModalSuccess}
          onError={handlePaymentModalError}
        />
      )}
    </div>
  );
};

export default PurchasePage;

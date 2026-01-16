import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/currency";
import { DrawManager } from "@/utils/drawManager";
import { AgentWalletManager } from "@/utils/agentWallet";
import { AgentTicketManager } from "@/utils/agentTicketManager";
import { UserLookup } from "@/utils/userLookup";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Ticket, 
  DollarSign, 
  TrendingUp,
  Users,
  LogOut,
  Search,
  CheckCircle2,
  X,
  Loader2,
  CreditCard,
  Banknote,
  History,
  RefreshCw,
  Plus
} from "lucide-react";
import { User } from "@/contexts/AuthContext";
import { AgentWalletTopup } from "@/components/AgentWalletTopup";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // State
  const [wallet, setWallet] = useState<any>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [activeDraws, setActiveDraws] = useState<any[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>("");
  const [userIdentifier, setUserIdentifier] = useState<string>("");
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [selectedTicketNumber, setSelectedTicketNumber] = useState<string>("");
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  // Load data
  useEffect(() => {
    if (user?.id) {
      loadWalletData();
      loadActiveDraws();
      loadRecentSales();
      // Refresh every 5 seconds
      const interval = setInterval(() => {
        loadWalletData();
        loadRecentSales();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Load available numbers when draw is selected
  useEffect(() => {
    if (selectedDraw) {
      const numbers = AgentTicketManager.getAvailableNumbers(selectedDraw);
      setAvailableNumbers(numbers);
      setSelectedTicketNumber(""); // Reset selection
    }
  }, [selectedDraw]);

  // Check for top-up success/cancel in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topupStatus = params.get("topup");
    if (topupStatus === "success") {
      toast({
        title: "Payment Initiated",
        description: "Your payment is being processed. Balance will update automatically.",
      });
      window.history.replaceState({}, "", "/agent");
      loadWalletData();
    } else if (topupStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/agent");
    }
  }, [toast]);

  const loadWalletData = () => {
    if (!user?.id) return;
    const walletData = AgentWalletManager.getWallet(user.id);
    const stats = AgentWalletManager.getTodayStats(user.id);
    setWallet(walletData);
    setTodayStats(stats);
  };

  const loadActiveDraws = () => {
    const draws = DrawManager.getAllPendingDraws();
    setActiveDraws(draws);
    if (draws.length > 0 && !selectedDraw) {
      setSelectedDraw(draws[0].id);
    }
  };

  const loadRecentSales = () => {
    if (!user?.id) return;
    const sales = AgentTicketManager.getAgentSales(user.id, 10);
    setRecentSales(sales);
  };

  const handleSearchUser = () => {
    if (!userIdentifier.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID, phone number, or email",
        variant: "destructive",
      });
      return;
    }

    const user = UserLookup.search(userIdentifier.trim());
    if (user) {
      setFoundUser(user);
      toast({
        title: "User Found",
        description: `Found: ${user.firstName} ${user.lastName}`,
      });
    } else {
      setFoundUser(null);
      toast({
        title: "User Not Found",
        description: "No user found with that identifier",
        variant: "destructive",
      });
    }
  };

  const handleSellTicket = async () => {
    if (!selectedDraw) {
      toast({
        title: "Error",
        description: "Please select a draw",
        variant: "destructive",
      });
      return;
    }

    if (!foundUser) {
      toast({
        title: "Error",
        description: "Please find a user first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTicketNumber) {
      toast({
        title: "Error",
        description: "Please select a ticket number",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const result = AgentTicketManager.allocateTicket(
        user.id,
        foundUser.id,
        selectedDraw,
        selectedTicketNumber,
        paymentMethod
      );

      if (result.success) {
        toast({
          title: "Ticket Sold!",
          description: `Ticket ${selectedTicketNumber} allocated to ${foundUser.firstName} ${foundUser.lastName}`,
        });
        
        // Reset form
        setUserIdentifier("");
        setFoundUser(null);
        setSelectedTicketNumber("");
        
        // Reload data
        loadWalletData();
        loadRecentSales();
        if (selectedDraw) {
          const numbers = AgentTicketManager.getAvailableNumbers(selectedDraw);
          setAvailableNumbers(numbers);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to sell ticket",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sell ticket",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoSelectNumber = () => {
    if (availableNumbers.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      setSelectedTicketNumber(availableNumbers[randomIndex]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const selectedDrawData = activeDraws.find((d) => d.id === selectedDraw);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Agent Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Wallet & Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Wallet Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTopupModal(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Top Up
              </Button>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">
              {wallet ? formatCurrency(wallet.balance) : "Loading..."}
            </p>
          </motion.div>

          {/* Today's Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Today's Sales</span>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-success">
              {todayStats ? formatCurrency(todayStats.sales) : "Loading..."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {todayStats?.ticketsSold || 0} tickets sold
            </p>
          </motion.div>

          {/* Today's Commission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-warning" />
                <span className="text-sm text-muted-foreground">Today's Commission</span>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-warning">
              {todayStats ? formatCurrency(todayStats.commissions) : "Loading..."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              10% commission rate
            </p>
          </motion.div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Sell Ticket */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="text-xl font-display font-bold text-foreground mb-6">
              Sell Ticket
            </h2>

            {/* Select Draw */}
            <div className="mb-4">
              <Label htmlFor="draw">Select Draw</Label>
              <select
                id="draw"
                value={selectedDraw}
                onChange={(e) => setSelectedDraw(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-xl bg-background border border-border text-foreground"
              >
                {activeDraws.map((draw) => (
                  <option key={draw.id} value={draw.id}>
                    {draw.title || draw.drawNumber} - {formatCurrency(draw.ticketPrice || 500)} per ticket
                  </option>
                ))}
              </select>
              {selectedDrawData && (
                <p className="text-xs text-muted-foreground mt-1">
                  Prize: {formatCurrency(selectedDrawData.prizeAmount || 0)} | 
                  Available: {availableNumbers.length} tickets
                </p>
              )}
            </div>

            {/* User Search */}
            <div className="mb-4">
              <Label htmlFor="userSearch">User ID / Phone / Email</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="userSearch"
                  placeholder="Enter user identifier"
                  value={userIdentifier}
                  onChange={(e) => setUserIdentifier(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchUser()}
                />
                <Button onClick={handleSearchUser} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {foundUser && (
                <div className="mt-2 p-3 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-foreground">
                      {foundUser.firstName} {foundUser.lastName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {foundUser.email} | {foundUser.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Ticket Number Selection */}
            {foundUser && selectedDraw && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Ticket Number (00-99)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoSelectNumber}
                    disabled={availableNumbers.length === 0}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Auto Select
                  </Button>
                </div>
                <div className="grid grid-cols-10 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border border-border rounded-xl">
                  {Array.from({ length: 100 }, (_, i) => {
                    const num = i.toString().padStart(2, "0");
                    const isAvailable = availableNumbers.includes(num);
                    const isSelected = selectedTicketNumber === num;
                    return (
                      <button
                        key={num}
                        onClick={() => isAvailable && setSelectedTicketNumber(num)}
                        disabled={!isAvailable}
                        className={`
                          p-2 rounded-lg text-sm font-medium transition-all
                          ${isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : isAvailable
                            ? "bg-card hover:bg-primary/10 text-foreground border border-border"
                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                          }
                        `}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                {selectedTicketNumber && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: <span className="font-bold text-foreground">{selectedTicketNumber}</span>
                  </p>
                )}
              </div>
            )}

            {/* Payment Method */}
            {foundUser && selectedTicketNumber && (
              <div className="mb-4">
                <Label>Payment Method</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                    className="flex-1"
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === "online" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("online")}
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Online
                  </Button>
                </div>
              </div>
            )}

            {/* Sell Button */}
            {foundUser && selectedTicketNumber && (
              <Button
                onClick={handleSellTicket}
                disabled={isProcessing || !wallet || wallet.balance < (selectedDrawData?.ticketPrice || 500)}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 mr-2" />
                    Sell Ticket ({formatCurrency(selectedDrawData?.ticketPrice || 500)})
                  </>
                )}
              </Button>
            )}

            {wallet && wallet.balance < (selectedDrawData?.ticketPrice || 500) && (
              <p className="text-xs text-destructive mt-2 text-center">
                Insufficient wallet balance. Please top up your wallet.
              </p>
            )}
          </motion.div>

          {/* Right Column - Sales History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-foreground">
                Recent Sales
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSalesHistory(!showSalesHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                {showSalesHistory ? "Hide" : "View All"}
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentSales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sales yet. Start selling tickets!
                </p>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">
                          Ticket #{sale.ticketNumber}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sale.paymentMethod === "cash" 
                          ? "bg-blue-500/10 text-blue-500" 
                          : "bg-green-500/10 text-green-500"
                      }`}>
                        {sale.paymentMethod === "cash" ? "Cash" : "Online"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(sale.price)}
                      </span>
                      <span className="text-success font-medium">
                        +{formatCurrency(sale.commission)} commission
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(sale.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wallet Top-up Modal */}
      {user?.id && (
        <AgentWalletTopup
          isOpen={showTopupModal}
          onClose={() => setShowTopupModal(false)}
          agentId={user.id}
          onSuccess={() => {
            loadWalletData();
            setShowTopupModal(false);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default AgentDashboard;

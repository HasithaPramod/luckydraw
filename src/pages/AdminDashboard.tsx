import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatCurrencyShort } from "@/utils/currency";
import { DrawManager } from "@/utils/drawManager";
import { TicketManager } from "@/utils/ticketManager";
import { Analytics } from "@/utils/analytics";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  DollarSign, 
  Users, 
  Trophy, 
  History,
  ChevronRight,
  LogOut,
  Plus,
  CheckCircle2,
  X,
  Loader2,
  Trash2
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showCreateDraw, setShowCreateDraw] = useState(false);
  const [winningNumber, setWinningNumber] = useState<string>("");
  const [prizeAmount, setPrizeAmount] = useState<string>("");
  const [ticketPrice, setTicketPrice] = useState<string>("500");
  const [drawTitle, setDrawTitle] = useState<string>("");
  const [drawDescription, setDrawDescription] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [resultDate, setResultDate] = useState<string>("");
  const [resultTime, setResultTime] = useState<string>("");
  const [extendDate, setExtendDate] = useState<string>("");
  const [extendTime, setExtendTime] = useState<string>("");
  const [extendingDrawId, setExtendingDrawId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draws, setDraws] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agentForm, setAgentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nic: "",
    password: "",
    initialBalance: "",
  });
  const [allAgents, setAllAgents] = useState<any[]>([]);

  // Load draws and stats
  useEffect(() => {
    loadDraws();
    loadPlatformStats();
    loadAgents();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadPlatformStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDraws = () => {
    const allDraws = DrawManager.getAllDraws();
    // Sort by date (newest first), then by status (pending first)
    const sortedDraws = allDraws.sort((a, b) => {
      // First sort by status (pending first)
      if (a.status !== b.status) {
        return a.status === "pending" ? -1 : 1;
      }
      // Then sort by date (newest first)
      return b.drawDate - a.drawDate;
    });
    setDraws(sortedDraws);
    console.log(`Loaded ${allDraws.length} draws (${allDraws.filter(d => d.status === "pending").length} pending, ${allDraws.filter(d => d.status === "completed").length} completed)`);
  };

  const loadPlatformStats = () => {
    const stats = Analytics.getPlatformStats();
    setPlatformStats(stats);
  };

  const handleCleanupOldDraws = () => {
    try {
      DrawManager.cleanupOldDraws();
      loadDraws();
      loadPlatformStats();
      toast({
        title: "Cleanup Complete",
        description: "Old completed draws have been removed. Only the 50 most recent are kept.",
      });
    } catch (error: any) {
      toast({
        title: "Cleanup Error",
        description: error.message || "Failed to cleanup old draws",
        variant: "destructive",
      });
    }
  };

  const handleClearAllData = () => {
    if (!window.confirm("⚠️ WARNING: This will delete ALL data including:\n\n• All draws\n• All tickets\n• All users (except demo users)\n• All locked numbers\n• All reserved numbers\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?")) {
      return;
    }

    try {
      // Clear all localStorage keys used by the application
      localStorage.removeItem("draws");
      localStorage.removeItem("userTickets");
      localStorage.removeItem("lockedNumbers");
      localStorage.removeItem("reservedNumbers");
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      
      // Keep demo users but clear registered users (they'll be recreated on next load)
      localStorage.removeItem("registeredUsers");
      
      // Reload the page to reset everything
      toast({
        title: "All Data Cleared",
        description: "All application data has been removed. The page will reload.",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Clear Data Error",
        description: error.message || "Failed to clear all data",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const loadAgents = () => {
    try {
      const usersData = localStorage.getItem("registeredUsers");
      if (usersData) {
        const users = JSON.parse(usersData);
        const agents = users.filter((u: any) => u.role === "agent");
        setAllAgents(agents);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleCreateAgent = async () => {
    // Validate form
    if (!agentForm.firstName || !agentForm.lastName || !agentForm.email || !agentForm.phone || !agentForm.nic || !agentForm.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (agentForm.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get existing users
      const usersData = localStorage.getItem("registeredUsers");
      const users: Array<any> = usersData ? JSON.parse(usersData) : [];

      // Check if email already exists
      if (users.some((u) => u.email.toLowerCase() === agentForm.email.toLowerCase())) {
        toast({
          title: "Error",
          description: "Email already exists",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Create new agent
      const newAgent = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: agentForm.email,
        firstName: agentForm.firstName,
        lastName: agentForm.lastName,
        phone: agentForm.phone,
        nic: agentForm.nic,
        role: "agent" as const,
        password: agentForm.password,
        registrationDate: Date.now(),
      };

      // Add to users array
      users.push(newAgent);
      localStorage.setItem("registeredUsers", JSON.stringify(users));

      // Initialize wallet for new agent
      const { AgentWalletManager } = await import("@/utils/agentWallet");
      AgentWalletManager.getWallet(newAgent.id); // This will create the wallet

      // Add initial balance if provided
      const initialBalance = parseFloat(agentForm.initialBalance) || 0;
      if (initialBalance > 0) {
        AgentWalletManager.addFunds(
          newAgent.id,
          initialBalance,
          `Initial balance set by admin during account creation`
        );
      }

      toast({
        title: "Agent Created!",
        description: `${agentForm.firstName} ${agentForm.lastName} has been created as an agent.${initialBalance > 0 ? ` Initial balance: ${formatCurrency(initialBalance)}` : ""}`,
      });

      // Reset form
      setAgentForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nic: "",
        password: "",
        initialBalance: "",
      });
      setShowCreateAgent(false);
      loadAgents();
      loadPlatformStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 5MB. The image will be compressed automatically.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDraw = async () => {
    // Validate result date/time
    if (!resultDate || !resultTime) {
      toast({
        title: "Missing Information",
        description: "Please enter result announcement date and time",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const prize = prizeAmount ? parseFloat(prizeAmount) : 0;
      
      // Convert image to base64 if provided
      let imageUrl = "";
      if (imageFile) {
        imageUrl = imagePreview; // Use the preview which is already base64
      }

      // Combine date and time
      const resultDateTime = new Date(`${resultDate}T${resultTime}`);
      const resultTimestamp = resultDateTime.getTime();

      if (isNaN(resultTimestamp) || resultTimestamp < Date.now()) {
        toast({
          title: "Invalid Date/Time",
          description: "Result announcement date/time must be in the future",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Validate ticket price
      const price = ticketPrice ? parseFloat(ticketPrice) : 500;
      if (isNaN(price) || price <= 0) {
        toast({
          title: "Invalid Ticket Price",
          description: "Ticket price must be a positive number",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Create draw without winning number (will be set later)
      const draw = await DrawManager.createDraw(
        "", // Empty winning number - will be set when result time arrives
        prize,
        drawTitle || "",
        drawDescription || "",
        imageUrl,
        resultTimestamp,
        price
      );
      
      toast({
        title: "Draw Created",
        description: `Draw created successfully. Enter winning number when result time arrives.`,
      });

      // Reset form
      setPrizeAmount("");
      setTicketPrice("500");
      setDrawTitle("");
      setDrawDescription("");
      setImageFile(null);
      setImagePreview("");
      setResultDate("");
      setResultTime("");
      setShowCreateDraw(false);
      loadDraws();
      loadPlatformStats();
    } catch (error: any) {
      console.error("Error creating draw:", error);
      toast({
        title: "Error Creating Draw",
        description: error.message || "Failed to create draw. Storage may be full - try using smaller images or clearing old draws.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtendDate = async (drawId: string) => {
    if (!extendDate || !extendTime) {
      toast({
        title: "Missing Information",
        description: "Please enter new date and time",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const newDateTime = new Date(`${extendDate}T${extendTime}`);
      const newTimestamp = newDateTime.getTime();

      if (isNaN(newTimestamp) || newTimestamp < Date.now()) {
        toast({
          title: "Invalid Date/Time",
          description: "New date/time must be in the future",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const success = DrawManager.extendDrawDate(drawId, newTimestamp);
      if (success) {
        toast({
          title: "Date Extended",
          description: `Draw date extended to ${newDateTime.toLocaleString()}`,
        });
        setExtendDate("");
        setExtendTime("");
        setExtendingDrawId(null);
        loadDraws();
      } else {
        throw new Error("Failed to extend draw date");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extend draw date",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetWinningNumber = async (drawId: string) => {
    // Validate winning number (00-99)
    const num = parseInt(winningNumber);
    if (isNaN(num) || num < 0 || num > 99) {
      toast({
        title: "Invalid Number",
        description: "Winning number must be between 00 and 99",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const draw = DrawManager.getDrawById(drawId);
      if (!draw) {
        throw new Error("Draw not found");
      }

      // Update draw with winning number
      const draws = DrawManager.getAllDraws();
      const drawIndex = draws.findIndex((d: any) => d.id === drawId);
      if (drawIndex === -1) {
        throw new Error("Draw not found");
      }

      draws[drawIndex].winningNumber = winningNumber.padStart(2, "0");
      localStorage.setItem("draws", JSON.stringify(draws));

      // Complete the draw and match tickets
      const result = DrawManager.completeDraw(drawId);
      
      toast({
        title: "Winning Number Set",
        description: `Winning number: ${draws[drawIndex].winningNumber}. ${result.matchedTickets} ticket(s) matched!`,
      });

      setWinningNumber("");
      loadDraws();
      loadPlatformStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set winning number",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get comprehensive stats for display
  const getStatsDisplay = () => {
    if (!platformStats) return [];
    
    return [
      { icon: Users, label: "Total Users", value: platformStats.totalUsers.toLocaleString(), color: "text-primary" },
      { icon: Users, label: "Daily Registrations", value: platformStats.dailyRegistrations.toString(), color: "text-primary" },
      { icon: Users, label: "Active Users (30d)", value: platformStats.activeUsers.toLocaleString(), color: "text-success" },
      { icon: Ticket, label: "Total Tickets", value: platformStats.totalTickets.toLocaleString(), color: "text-warning" },
      { icon: DollarSign, label: "Total Revenue", value: formatCurrencyShort(platformStats.totalRevenue), color: "text-success" },
      { icon: DollarSign, label: "Today Revenue", value: formatCurrencyShort(platformStats.todayRevenue), color: "text-success" },
      { icon: Ticket, label: "Tickets Today", value: platformStats.ticketsSoldToday.toString(), color: "text-primary" },
      { icon: Trophy, label: "Total Draws", value: platformStats.totalDraws.toString(), color: "text-celebration" },
    ];
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {user ? `Welcome, ${user.firstName} ${user.lastName}` : "Manage your raffle"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                Admin
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCleanupOldDraws} 
                title="Cleanup Old Draws (Free Storage Space)"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClearAllData} 
                title="Clear All Data (Dangerous!)"
                className="text-destructive hover:text-destructive"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Desktop Layout - Two Columns */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left Column - Stats and Create Draw */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Statistics - CRM Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-lg font-display font-bold text-foreground mb-4">
                Platform Statistics
              </h2>
              {platformStats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {getStatsDisplay().map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card rounded-2xl p-4"
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                      <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading statistics...</p>
                </div>
              )}
            </motion.div>

            {/* Additional CRM Metrics */}
            {platformStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-md font-semibold text-foreground mb-4">Revenue & Activity Overview</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Weekly Revenue</p>
                    <p className="text-lg font-bold text-success">{formatCurrencyShort(platformStats.weeklyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Revenue</p>
                    <p className="text-lg font-bold text-success">{formatCurrencyShort(platformStats.monthlyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Weekly Registrations</p>
                    <p className="text-lg font-bold text-primary">{platformStats.weeklyRegistrations}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Registrations</p>
                    <p className="text-lg font-bold text-primary">{platformStats.monthlyRegistrations}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tickets This Week</p>
                    <p className="text-lg font-bold text-warning">{platformStats.ticketsSoldThisWeek}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tickets This Month</p>
                    <p className="text-lg font-bold text-warning">{platformStats.ticketsSoldThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Ticket Price</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(platformStats.averageTicketPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pending Draws</p>
                    <p className="text-lg font-bold text-warning">{platformStats.pendingDraws}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Create Draw Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-foreground">
              Create Draw
            </h2>
            {!showCreateDraw && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowCreateDraw(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Draw
              </Button>
            )}
          </div>

          {showCreateDraw && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Enter Winning Number</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCreateDraw(false);
                    setWinningNumber("");
                    setPrizeAmount("");
                    setTicketPrice("500");
                    setDrawTitle("");
                    setDrawDescription("");
                    setImageFile(null);
                    setImagePreview("");
                    setResultDate("");
                    setResultTime("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Draw Title
                  </Label>
                  <Input
                    type="text"
                    value={drawTitle}
                    onChange={(e) => setDrawTitle(e.target.value)}
                    placeholder="Enter draw title"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Draw Description
                  </Label>
                  <Textarea
                    value={drawDescription}
                    onChange={(e) => setDrawDescription(e.target.value)}
                    placeholder="Enter draw description..."
                    disabled={isProcessing}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Draw Image
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isProcessing}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                </div>


                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Ticket Price (LKR) *
                    </Label>
                    <Input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      placeholder="500"
                      className="text-center"
                      disabled={isProcessing}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Prize Amount (LKR) - Optional
                    </Label>
                    <Input
                      type="number"
                      value={prizeAmount}
                      onChange={(e) => setPrizeAmount(e.target.value)}
                      placeholder="0"
                      className="text-center"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Result Date
                    </Label>
                    <Input
                      type="date"
                      value={resultDate}
                      onChange={(e) => setResultDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Result Time
                    </Label>
                    <Input
                      type="time"
                      value={resultTime}
                      onChange={(e) => setResultTime(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleCreateDraw}
                  disabled={isProcessing || !resultDate || !resultTime}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Draw
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
          </motion.div>
          </div>

          {/* Right Column - Agent Management & Draw History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Agent Management Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-foreground">
                  Agent Management
                </h2>
                {!showCreateAgent && (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => setShowCreateAgent(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Agent
                  </Button>
                )}
              </div>

              {showCreateAgent ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6 space-y-4 mb-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Create New Agent</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowCreateAgent(false);
                        setAgentForm({
                          firstName: "",
                          lastName: "",
                          email: "",
                          phone: "",
                          nic: "",
                          password: "",
                          initialBalance: "",
                        });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="agentFirstName">First Name</Label>
                        <Input
                          id="agentFirstName"
                          value={agentForm.firstName}
                          onChange={(e) => setAgentForm({ ...agentForm, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="agentLastName">Last Name</Label>
                        <Input
                          id="agentLastName"
                          value={agentForm.lastName}
                          onChange={(e) => setAgentForm({ ...agentForm, lastName: e.target.value })}
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="agentEmail">Email</Label>
                      <Input
                        id="agentEmail"
                        type="email"
                        value={agentForm.email}
                        onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                        placeholder="agent@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agentPhone">Phone</Label>
                      <Input
                        id="agentPhone"
                        value={agentForm.phone}
                        onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                        placeholder="+94771234567"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agentNIC">NIC Number</Label>
                      <Input
                        id="agentNIC"
                        value={agentForm.nic}
                        onChange={(e) => setAgentForm({ ...agentForm, nic: e.target.value })}
                        placeholder="123456789V"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agentPassword">Password</Label>
                      <Input
                        id="agentPassword"
                        type="password"
                        value={agentForm.password}
                        onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agentInitialBalance">Initial Wallet Balance (LKR)</Label>
                      <Input
                        id="agentInitialBalance"
                        type="number"
                        min="0"
                        step="0.01"
                        value={agentForm.initialBalance}
                        onChange={(e) => setAgentForm({ ...agentForm, initialBalance: e.target.value })}
                        placeholder="0.00 (optional)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Set initial balance for the agent wallet. Leave empty for 0.
                      </p>
                    </div>

                    <Button
                      onClick={handleCreateAgent}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Agent
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {/* Agents List */}
              <div className="glass-card rounded-2xl p-6 space-y-3 mb-6">
                <h3 className="font-semibold text-foreground mb-3">All Agents ({allAgents.length})</h3>
                {allAgents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No agents created yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="p-3 rounded-xl bg-background border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {agent.firstName} {agent.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{agent.email}</p>
                            <p className="text-xs text-muted-foreground">{agent.phone}</p>
                          </div>
                          <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            Agent
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Draw History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-foreground">
                  Draw History
                </h2>
                <div className="text-xs text-muted-foreground">
                  {draws.filter((d) => d.status === "pending").length} Pending • {draws.filter((d) => d.status === "completed").length} Completed
                </div>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {draws.length === 0 ? (
              <div className="p-6 rounded-2xl bg-card border border-border text-center">
                <p className="text-muted-foreground">No draws created yet</p>
              </div>
            ) : (
              draws.map((draw, index) => {
                const drawDate = new Date(draw.drawDate);
                const winningTickets = DrawManager.getWinningTickets(draw.id);
                
                return (
                  <motion.div
                    key={draw.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-4 rounded-2xl bg-card border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          draw.status === "completed" ? "gradient-gold" : "bg-muted"
                        }`}>
                          <Trophy className={`w-5 h-5 ${
                            draw.status === "completed" ? "text-foreground" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{draw.drawNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {drawDate.toLocaleDateString()} {drawDate.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        draw.status === "completed" 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      }`}>
                        {draw.status === "completed" ? "Completed" : "Pending"}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Winning Number</p>
                        <p className="font-bold text-foreground text-lg">
                          {draw.winningNumber || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tickets Sold</p>
                        <p className="font-bold text-foreground">
                          {DrawManager.getTicketCountForDraw(draw.drawNumber)} / 100
                        </p>
                      </div>
                    </div>

                    {/* Extend Date Section - Show if pending and less than 100 tickets */}
                    {draw.status === "pending" && 
                     DrawManager.getTicketCountForDraw(draw.drawNumber) < 100 && (
                      <div className="pt-3 border-t border-border">
                        {extendingDrawId === draw.id ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground mb-2">
                              Extend Result Date ({DrawManager.getTicketCountForDraw(draw.drawNumber)}/100 tickets sold):
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                value={extendDate}
                                onChange={(e) => setExtendDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                disabled={isProcessing}
                              />
                              <Input
                                type="time"
                                value={extendTime}
                                onChange={(e) => setExtendTime(e.target.value)}
                                disabled={isProcessing}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="hero"
                                size="sm"
                                onClick={() => handleExtendDate(draw.id)}
                                disabled={isProcessing || !extendDate || !extendTime}
                                className="flex-1"
                              >
                                Extend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setExtendingDrawId(null);
                                  setExtendDate("");
                                  setExtendTime("");
                                }}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setExtendingDrawId(draw.id)}
                          >
                            Extend Result Date
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Enter Winning Number Section - Show when result time has passed but not set */}
                    {draw.status === "pending" && 
                     draw.resultAnnouncementDate && 
                     Date.now() >= draw.resultAnnouncementDate && 
                     !draw.winningNumber && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Result time has arrived. Enter winning number:
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="99"
                            value={winningNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 99)) {
                                setWinningNumber(val);
                              }
                            }}
                            placeholder="00"
                            className="text-center text-xl font-bold flex-1"
                            disabled={isProcessing}
                          />
                          <Button
                            variant="hero"
                            size="lg"
                            onClick={() => handleSetWinningNumber(draw.id)}
                            disabled={isProcessing || !winningNumber}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Set"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {draw.status === "completed" && winningTickets.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Winning Tickets:</p>
                        <div className="flex flex-wrap gap-2">
                          {winningTickets.slice(0, 5).map((ticket: any) => (
                            <span
                              key={ticket.id}
                              className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-mono"
                            >
                              {ticket.luckyNumbers[0]}
                            </span>
                          ))}
                          {winningTickets.length > 5 && (
                            <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs">
                              +{winningTickets.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions - Full Width on Mobile, Below on Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4"
        >
          <h2 className="text-lg font-display font-bold text-foreground mb-4 lg:col-span-2">
            Quick Actions
          </h2>
          <Button variant="outline" className="w-full justify-start" size="lg">
            <History className="w-5 h-5 mr-3" />
            Export Ticket Data
          </Button>
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Users className="w-5 h-5 mr-3" />
            View All Participants
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminDashboard;

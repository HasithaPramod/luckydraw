import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import { PrizeCard } from "@/components/PrizeCard";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/utils/currency";
import { DrawManager } from "@/utils/drawManager";
import { Ticket, Users, Shield, Sparkles, Calendar, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pendingDraws, setPendingDraws] = useState<any[]>([]);
  const [latestDraw, setLatestDraw] = useState<any>(null);

  // Load all pending draws and latest draw
  useEffect(() => {
    const loadDraws = () => {
      // Get all pending draws and sort by result announcement date (earlier dates first)
      const pending = DrawManager.getAllPendingDraws();
      const sorted = pending.sort((a, b) => {
        // Sort by result announcement date (earlier dates first)
        return a.resultAnnouncementDate - b.resultAnnouncementDate;
      });
      setPendingDraws(sorted);
      
      // Get latest draw (for display - can be completed or pending)
      const latest = DrawManager.getLatestDraw();
      if (latest) {
        setLatestDraw(latest);
      }
    };
    
    loadDraws();
    // Refresh every 5 seconds to check for new draws
    const interval = setInterval(loadDraws, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBuyTickets = (drawId?: string) => {
    if (isAuthenticated) {
      if (drawId) {
        navigate(`/purchase?draw=${drawId}`);
      } else {
        navigate("/purchase");
      }
    } else {
      // Redirect to login with purchase page as the target
      navigate("/login", { state: { from: drawId ? `/purchase?draw=${drawId}` : "/purchase" } });
    }
  };

  // Use latest draw's result announcement date, or fallback
  const displayDraw = latestDraw;
  const drawDate = displayDraw?.resultAnnouncementDate 
    ? new Date(displayDraw.resultAnnouncementDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const stats = [
    { icon: Ticket, value: "2,847", label: "Tickets Sold" },
    { icon: Users, value: "1,234", label: "Participants" },
    { icon: Shield, value: "100%", label: "Transparent" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        
        <div className="relative z-10 container mx-auto px-4 pt-8 pb-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">LuckyDraw</span>
            </div>
          </motion.div>

          {/* Prize Card - Only show if there's a draw */}
          {displayDraw && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PrizeCard
                title={displayDraw.title}
                value={formatCurrency(displayDraw.prizeAmount || 0)}
                description={displayDraw.description}
                imageUrl={displayDraw.imageUrl}
              />
            </motion.div>
          )}

          {/* Countdown - Only show if there's a draw */}
          {displayDraw && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <p className="text-center text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
                Draw ends in
              </p>
              <CountdownTimer targetDate={drawDate} />
            </motion.div>
          )}

          {/* All Pending Draws Section */}
          {pendingDraws.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <h3 className="text-lg font-display font-bold text-foreground mb-4">
                Available Draws
              </h3>
              <div className="space-y-3">
                {pendingDraws.map((draw, index) => {
                  const ticketCount = DrawManager.getTicketCountForDraw(draw.drawNumber);
                  const resultDate = new Date(draw.resultAnnouncementDate);
                  
                  return (
                    <motion.div
                      key={draw.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="rounded-2xl bg-card border border-border overflow-hidden"
                    >
                      {/* Cover Image */}
                      {draw.imageUrl && (
                        <div className="w-full h-48 overflow-hidden">
                          <img
                            src={draw.imageUrl}
                            alt={draw.title || draw.drawNumber}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="mb-3">
                          <h4 className="font-semibold text-foreground mb-1 text-lg">
                            {draw.title || draw.drawNumber}
                          </h4>
                          {draw.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {draw.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {resultDate.toLocaleDateString()} {resultDate.toLocaleTimeString()}
                            </span>
                            <span>
                              {ticketCount} / 100 tickets
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div>
                            <p className="text-sm text-muted-foreground">Prize</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(draw.prizeAmount || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Ticket Price</p>
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(draw.ticketPrice || 500)}
                            </p>
                          </div>
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => handleBuyTickets(draw.id)}
                            disabled={ticketCount >= 100}
                          >
                            <Ticket className="w-4 h-4 mr-2" />
                            Buy Tickets
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        {ticketCount >= 100 && (
                          <p className="text-xs text-warning mt-2 text-center">
                            This draw is full
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {pendingDraws.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <div className="p-6 rounded-2xl bg-card border border-border text-center">
                <p className="text-muted-foreground">
                  No active draws available at the moment.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please check back later for new draws.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="container mx-auto px-4 mt-8"
      >
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="container mx-auto px-4 mt-8"
      >
        <h2 className="text-xl font-display font-bold text-foreground mb-4">How It Works</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Buy Tickets", desc: "Purchase as many tickets as you want" },
            { step: "2", title: "Wait for Draw", desc: "Keep your tickets safe until the draw" },
            { step: "3", title: "Win Big", desc: "Random winner selected live on draw day" },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold">{item.step}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Index;

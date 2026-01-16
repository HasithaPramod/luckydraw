import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/currency";
import { DrawManager } from "@/utils/drawManager";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Clock, Eye, CheckCircle2, Users, Calendar, Ticket, ArrowRight } from "lucide-react";

const DrawPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [latestDraw, setLatestDraw] = useState<any>(null);
  const [pendingDraws, setPendingDraws] = useState<any[]>([]);
  const [winningTickets, setWinningTickets] = useState<any[]>([]);
  const [isCountdownOver, setIsCountdownOver] = useState(false);

  useEffect(() => {
    loadDraws();
    // Refresh every 5 seconds to get latest draw
    const interval = setInterval(loadDraws, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (latestDraw && latestDraw.resultAnnouncementDate) {
      const checkCountdown = () => {
        const now = Date.now();
        const resultTime = latestDraw.resultAnnouncementDate;
        setIsCountdownOver(now >= resultTime);
      };
      
      checkCountdown();
      const interval = setInterval(checkCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [latestDraw]);

  const loadDraws = () => {
    // Get all pending draws and sort by result announcement date (earlier dates first)
    const pending = DrawManager.getAllPendingDraws();
    const sorted = pending.sort((a, b) => {
      // Sort by result announcement date (earlier dates first)
      return a.resultAnnouncementDate - b.resultAnnouncementDate;
    });
    setPendingDraws(sorted);
    
    // Get latest draw
    const draw = DrawManager.getLatestDraw();
    if (draw) {
      setLatestDraw(draw);
      if (draw.status === "completed") {
        const tickets = DrawManager.getWinningTickets(draw.id);
        setWinningTickets(tickets);
      }
    }
  };

  const handleBuyTickets = (drawId: string) => {
    if (isAuthenticated) {
      navigate(`/purchase?draw=${drawId}`);
    } else {
      navigate("/login", { state: { from: `/purchase?draw=${drawId}` } });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">Live Draw</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Live</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!latestDraw ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              No Draw Yet
            </h2>
            <p className="text-muted-foreground">
              Waiting for the next draw to be created...
            </p>
          </motion.div>
        ) : (
          <>
            {/* Draw Title, Description and Image - Show when countdown is over */}
            {isCountdownOver && latestDraw.title && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-display font-bold text-foreground mb-4 text-center">
                  {latestDraw.title}
                </h2>
                {latestDraw.description && (
                  <p className="text-muted-foreground text-center mb-4 px-4">
                    {latestDraw.description}
                  </p>
                )}
                {latestDraw.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={latestDraw.imageUrl}
                      alt={latestDraw.title}
                      className="w-full h-64 object-cover rounded-2xl border border-border"
                    />
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Results announced: {new Date(latestDraw.resultAnnouncementDate).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Countdown Timer - Show when countdown is not over */}
            {!isCountdownOver && latestDraw.resultAnnouncementDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                    {latestDraw.title || latestDraw.drawNumber}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Results will be announced in:
                  </p>
                </div>
                <CountdownTimer targetDate={new Date(latestDraw.resultAnnouncementDate)} />
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {new Date(latestDraw.resultAnnouncementDate).toLocaleString()}
                </div>
              </motion.div>
            )}

            {/* Draw Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                {latestDraw.drawNumber}
              </h2>
              <p className="text-muted-foreground">
                {new Date(latestDraw.drawDate).toLocaleDateString()} •{" "}
                {latestDraw.status === "completed" ? "Completed" : "Pending"}
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="glass-card rounded-2xl p-4 text-center">
                <Trophy className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-xl font-display font-bold text-foreground">
                  {latestDraw.prizeAmount > 0 ? formatCurrency(latestDraw.prizeAmount) : "TBD"}
                </p>
                <p className="text-xs text-muted-foreground">Prize Value</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-display font-bold text-foreground">
                  {latestDraw.totalTickets || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
            </motion.div>

            {/* Winning Number Display - Only show when countdown is over */}
            {latestDraw.status === "completed" && isCountdownOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className="glass-card rounded-3xl p-8 text-center">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground/80 uppercase tracking-wider mb-2">
                      Winning Number
                    </p>
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full gradient-gold mx-auto">
                      <span className="text-5xl font-display font-bold text-foreground">
                        {latestDraw.winningNumber}
                      </span>
                    </div>
                  </div>
                  
                  {winningTickets.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <p className="text-sm font-medium text-foreground/80 mb-3">
                        🎉 {winningTickets.length} Winner{winningTickets.length > 1 ? "s" : ""} Found!
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {winningTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="px-4 py-2 rounded-xl bg-success/10 border border-success/20"
                          >
                            <p className="text-xs text-muted-foreground">Ticket</p>
                            <p className="text-lg font-bold text-success">
                              {ticket.luckyNumbers[0]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {winningTickets.length === 0 && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        No tickets matched the winning number this draw.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pending Draw */}
            {latestDraw.status === "pending" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl p-8 text-center"
              >
                <Clock className="w-12 h-12 text-warning mx-auto mb-4 animate-pulse" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  Draw Pending
                </p>
                <p className="text-sm text-muted-foreground">
                  Waiting for the draw to be completed...
                </p>
              </motion.div>
            )}

            {/* Transparency Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border"
            >
              <p className="text-sm text-muted-foreground text-center">
                🔒 Draw results are automatically matched and verified for complete transparency.
              </p>
            </motion.div>
          </>
        )}

        {/* All Pending Draws Section */}
        {pendingDraws.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              Available Draws
            </h2>
            <div className="space-y-3">
              {pendingDraws.map((draw, index) => {
                const ticketCount = DrawManager.getTicketCountForDraw(draw.drawNumber);
                const resultDate = new Date(draw.resultAnnouncementDate);
                
                return (
                  <motion.div
                    key={draw.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
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
      </div>

      <BottomNav />
    </div>
  );
};

export default DrawPage;

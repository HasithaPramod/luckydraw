import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { TicketCard } from "@/components/TicketCard";
import { TicketManager } from "@/utils/ticketManager";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket } from "lucide-react";
import type { Ticket as TicketType } from "@/utils/ticketManager";

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [activeTickets, setActiveTickets] = useState<TicketType[]>([]);
  const [pastTickets, setPastTickets] = useState<TicketType[]>([]);

  useEffect(() => {
    if (user) {
      const active = TicketManager.getActiveTickets(user.id);
      const past = TicketManager.getPastTickets(user.id);
      setActiveTickets(active);
      setPastTickets(past);
    }
  }, [user]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-display font-bold text-foreground">My Tickets</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <Ticket className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-foreground">
                {activeTickets.length}
              </p>
              <p className="text-muted-foreground">Active Tickets</p>
            </div>
          </div>
        </motion.div>

        {/* Active Tickets */}
        {activeTickets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">
              Current Draw
            </h2>
            <div className="space-y-3">
              {activeTickets.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  luckyNumber={ticket.luckyNumbers[0]}
                  drawNumber={ticket.drawNumber}
                  status={ticket.status}
                  purchaseDate={formatDate(ticket.purchaseDate)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Tickets */}
        {pastTickets.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">
              Past Draws
            </h2>
            <div className="space-y-3">
              {pastTickets.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  luckyNumber={ticket.luckyNumbers[0]}
                  drawNumber={ticket.drawNumber}
                  status={ticket.status}
                  purchaseDate={formatDate(ticket.purchaseDate)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {activeTickets.length === 0 && pastTickets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No tickets yet</p>
            <p className="text-sm text-muted-foreground/70">
              Buy your first ticket to enter the draw!
            </p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyTicketsPage;

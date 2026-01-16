import { motion } from "framer-motion";
import { Ticket as TicketIcon } from "lucide-react";

interface TicketCardProps {
  ticketNumber?: string; // Legacy support
  luckyNumber: string; // The lucky number (00-99)
  drawNumber: string; // Draw identifier
  status: "active" | "won" | "lost";
  purchaseDate: string;
  index?: number;
}

export const TicketCard = ({ 
  ticketNumber, 
  luckyNumber, 
  drawNumber, 
  status, 
  purchaseDate, 
  index = 0 
}: TicketCardProps) => {
  const displayNumber = ticketNumber || `#${luckyNumber}`;
  const statusStyles = {
    active: "border-primary/30 bg-primary/5",
    won: "border-success/30 bg-success/10",
    lost: "border-muted-foreground/20 bg-muted/50",
  };

  const statusBadge = {
    active: { label: "Active", className: "bg-primary/10 text-primary" },
    won: { label: "Winner!", className: "bg-success/10 text-success" },
    lost: { label: "Not Selected", className: "bg-muted text-muted-foreground" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border-2 ${statusStyles[status]} p-4`}
    >
      {/* Decorative ticket edge */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />

      <div className="flex items-center justify-between pl-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${status === "won" ? "gradient-gold" : "gradient-primary"}`}>
            <TicketIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="ticket-number text-lg text-foreground">{displayNumber}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{purchaseDate}</p>
              <span className="text-xs text-muted-foreground">•</span>
              <p className="text-xs font-medium text-primary">{drawNumber}</p>
            </div>
            <div className="mt-1.5">
              <span className="text-xs text-muted-foreground">Lucky Number: </span>
              <span className="text-xs font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded">
                {luckyNumber}
              </span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[status].className}`}>
          {statusBadge[status].label}
        </span>
      </div>

      {status === "won" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full gradient-gold"
              initial={{ x: "50%", y: "50%" }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

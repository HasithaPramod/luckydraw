import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";

interface SpinningWheelProps {
  tickets: string[];
  onWinner: (ticket: string) => void;
  isAdmin?: boolean;
}

export const SpinningWheel = ({ tickets, onWinner, isAdmin = false }: SpinningWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  const startDraw = () => {
    if (tickets.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);

    let iteration = 0;
    const totalIterations = 30;
    const baseSpeed = 50;

    const spin = () => {
      const randomIndex = Math.floor(Math.random() * tickets.length);
      setCurrentTicket(tickets[randomIndex]);
      iteration++;

      if (iteration < totalIterations) {
        // Slow down gradually
        const delay = baseSpeed + (iteration * iteration * 2);
        setTimeout(spin, delay);
      } else {
        // Final selection
        const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];
        setCurrentTicket(winnerTicket);
        setWinner(winnerTicket);
        setIsSpinning(false);
        onWinner(winnerTicket);
      }
    };

    spin();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Main display */}
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          animate={isSpinning ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`absolute -inset-4 rounded-full ${isSpinning ? "gradient-primary opacity-30 blur-xl" : ""}`}
        />
        
        {/* Main circle */}
        <motion.div
          animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center ${
            winner ? "gradient-gold shadow-glow" : "glass-card border-4 border-primary/20"
          }`}
        >
          <AnimatePresence mode="wait">
            {currentTicket ? (
              <motion.div
                key={currentTicket}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="text-center"
              >
                {winner && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex justify-center mb-2"
                  >
                    <Trophy className="w-10 h-10 text-foreground" />
                  </motion.div>
                )}
                <span className={`ticket-number text-3xl sm:text-4xl ${winner ? "text-foreground" : "text-primary"}`}>
                  {currentTicket}
                </span>
                {winner && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-foreground/80 mt-2 font-semibold"
                  >
                    WINNER!
                  </motion.p>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">Ready to Draw</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spinning particles */}
          {isSpinning && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full gradient-primary"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    x: [0, Math.cos((i * 45 * Math.PI) / 180) * 120],
                    y: [0, Math.sin((i * 45 * Math.PI) / 180) * 120],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Draw button */}
      {isAdmin && (
        <Button
          variant="hero"
          size="xl"
          onClick={startDraw}
          disabled={isSpinning || tickets.length === 0}
          className="min-w-[200px]"
        >
          {isSpinning ? "Drawing..." : winner ? "Draw Again" : "Start Draw"}
        </Button>
      )}

      {/* Celebration effects */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  background: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: "-20px",
                }}
                animate={{
                  y: ["0vh", "100vh"],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeIn",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

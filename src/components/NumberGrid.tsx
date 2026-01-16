import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { NumberLockManager } from "@/utils/numberLockManager";
import { cn } from "@/lib/utils";
import { Clock, Lock } from "lucide-react";

interface NumberGridProps {
  selectedNumbers: string[];
  onNumberSelect: (number: string) => void;
  maxSelections: number;
}

export const NumberGrid = ({
  selectedNumbers,
  onNumberSelect,
  maxSelections,
}: NumberGridProps) => {
  const { user } = useAuth();
  const [lockedNumbers, setLockedNumbers] = useState<Map<string, number>>(new Map());
  const [reservedNumbers, setReservedNumbers] = useState<string[]>([]);

  // Generate numbers 00-99
  const numbers = Array.from({ length: 100 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Update locked and reserved numbers periodically
  useEffect(() => {
    const updateNumbers = () => {
      if (!user) return;

      // Get reserved numbers
      const reserved = NumberLockManager.getReservedNumbers();
      setReservedNumbers(reserved.map((r) => r.number));

      // Get locked numbers with remaining time
      const locks = NumberLockManager.getLockedNumbers();
      const lockMap = new Map<string, number>();
      locks.forEach((lock) => {
        const remaining = NumberLockManager.getRemainingLockTime(lock.number, lock.userId);
        if (remaining !== null && remaining > 0) {
          lockMap.set(lock.number, remaining);
        }
      });
      setLockedNumbers(lockMap);
    };

    updateNumbers();
    const interval = setInterval(updateNumbers, 1000); // Update every second

    return () => clearInterval(interval);
  }, [user]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getNumberStatus = (number: string) => {
    // Check if reserved (permanently taken)
    if (reservedNumbers.includes(number)) {
      return "reserved";
    }

    // Check if locked by current user
    if (lockedNumbers.has(number) && user) {
      const userLocks = NumberLockManager.getUserLockedNumbers(user.id);
      if (userLocks.find((l) => l.number === number)) {
        return "locked-by-me";
      }
      return "locked-by-other";
    }

    // Check if selected
    if (selectedNumbers.includes(number)) {
      return "selected";
    }

    return "available";
  };

  const handleNumberClick = (number: string) => {
    const status = getNumberStatus(number);

    if (status === "reserved" || status === "locked-by-other") {
      return; // Can't select
    }

    if (status === "selected") {
      // Deselect
      onNumberSelect(number);
      return;
    }

    if (status === "available") {
      // Check if we've reached max selections
      if (selectedNumbers.length >= maxSelections) {
        return;
      }

      // Select the number (locking is handled in PurchasePage)
      onNumberSelect(number);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Select up to {maxSelections} numbers (00-99)
        </p>
        <p className="text-sm text-muted-foreground">
          {selectedNumbers.length}/{maxSelections} selected
        </p>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {numbers.map((number) => {
          const status = getNumberStatus(number);
          const remainingTime = lockedNumbers.get(number);

          return (
            <motion.button
              key={number}
              onClick={() => handleNumberClick(number)}
              disabled={status === "reserved" || status === "locked-by-other"}
              className={cn(
                "relative aspect-square rounded-lg text-sm font-semibold transition-all",
                "disabled:cursor-not-allowed disabled:opacity-50",
                status === "selected" &&
                  "bg-primary text-primary-foreground shadow-md scale-105",
                status === "locked-by-me" &&
                  "bg-warning/20 text-warning border-2 border-warning",
                status === "locked-by-other" &&
                  "bg-muted text-muted-foreground cursor-not-allowed",
                status === "reserved" &&
                  "bg-destructive/20 text-destructive cursor-not-allowed",
                status === "available" &&
                  "bg-card border border-border hover:border-primary hover:bg-primary/5"
              )}
              whileHover={status === "available" ? { scale: 1.05 } : {}}
              whileTap={status === "available" ? { scale: 0.95 } : {}}
            >
              {number}
              {status === "locked-by-me" && remainingTime && (
                <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-warning text-warning-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatTime(remainingTime)}</span>
                </div>
              )}
              {status === "reserved" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-destructive" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warning/20 border-2 border-warning" />
          <span>Locked (5 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Locked by others</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive/20" />
          <span>Reserved</span>
        </div>
      </div>
    </div>
  );
};

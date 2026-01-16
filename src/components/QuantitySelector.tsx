import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  maxQuantity?: number;
  pricePerTicket: number;
}

export const QuantitySelector = ({
  quantity,
  onQuantityChange,
  maxQuantity = 10,
  pricePerTicket,
}: QuantitySelectorProps) => {
  const decrease = () => {
    if (quantity > 1) onQuantityChange(quantity - 1);
  };

  const increase = () => {
    if (quantity < maxQuantity) onQuantityChange(quantity + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          onClick={decrease}
          disabled={quantity <= 1}
          className="w-14 h-14 rounded-full"
        >
          <Minus className="w-6 h-6" />
        </Button>

        <motion.div
          key={quantity}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center"
        >
          <span className="text-4xl font-display font-bold text-primary">{quantity}</span>
        </motion.div>

        <Button
          variant="outline"
          size="icon"
          onClick={increase}
          disabled={quantity >= maxQuantity}
          className="w-14 h-14 rounded-full"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {quantity} ticket{quantity > 1 ? "s" : ""} × ${pricePerTicket.toFixed(2)}
        </p>
        <motion.p
          key={quantity}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-3xl font-display font-bold text-foreground mt-1"
        >
          ${(quantity * pricePerTicket).toFixed(2)}
        </motion.p>
      </div>
    </div>
  );
};

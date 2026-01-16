import { motion } from "framer-motion";
import { Gift, Sparkles, Trophy, Star } from "lucide-react";
import heroPrize from "@/assets/hero-prize.jpg";

interface PrizeCardProps {
  title: string;
  value: string;
  description?: string;
  imageUrl?: string;
}

export const PrizeCard = ({ title, value, description, imageUrl }: PrizeCardProps) => {
  // If imageUrl exists, always show image-based design (ignore description)
  // If no image but description exists, use elegant card design
  const showImage = !!imageUrl;
  const hasDescription = !!description && !showImage; // Only use description design if no image

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-3xl ${
        hasDescription 
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-lg" 
          : ""
      }`}
    >
      {/* Background Image - Only show if no description */}
      {showImage && (
        <div className="absolute inset-0">
          <img
            src={imageUrl || heroPrize}
            alt="Grand Prize"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 ${hasDescription ? "p-8" : "p-6 pt-32"} ${showImage ? "text-primary-foreground" : ""}`}>
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className={`w-5 h-5 ${hasDescription ? "text-primary" : "text-warning"} animate-pulse`} />
          </motion.div>
          <span className={`text-sm font-semibold ${hasDescription ? "text-primary" : "text-warning"} uppercase tracking-wider flex items-center gap-1`}>
            <Trophy className="w-4 h-4" />
            Grand Prize
          </span>
        </div>

        {/* Title */}
        <h3 className={`${hasDescription ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"} font-display font-bold mb-2 ${showImage ? "text-primary-foreground" : "text-foreground"}`}>
          {title}
        </h3>

        {/* Prize Value */}
        <div className="flex items-baseline gap-2 mb-3">
          <p className={`${hasDescription ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"} font-display font-bold ${hasDescription ? "text-primary" : "text-warning"} drop-shadow-sm`}>
            {value}
          </p>
          {hasDescription && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-6 h-6 text-warning fill-warning" />
            </motion.div>
          )}
        </div>

        {/* Description - Only show if no image (when using card design) */}
        {description && !showImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 rounded-2xl bg-card/50 border border-primary/10 backdrop-blur-sm"
          >
            <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
          </motion.div>
        )}
        
        {/* Floating decorative elements */}
        {hasDescription ? (
          <>
            <motion.div
              animate={{ 
                y: [-8, 8, -8],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-6 right-6"
            >
              <Gift className="w-10 h-10 text-primary/30" />
            </motion.div>
            <motion.div
              animate={{ 
                y: [8, -8, 8],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute bottom-6 left-6"
            >
              <Sparkles className="w-8 h-8 text-warning/20" />
            </motion.div>
          </>
        ) : (
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-4 right-4"
          >
            <Gift className="w-8 h-8 text-warning/50" />
          </motion.div>
        )}

        {/* Shine effect for description cards */}
        {hasDescription && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          />
        )}
      </div>
    </motion.div>
  );
};

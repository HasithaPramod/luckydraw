import { Home, Ticket, Trophy, User, LogIn, UserPlus } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/tickets", icon: Ticket, label: "My Tickets" },
  { path: "/draw", icon: Trophy, label: "Draw" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isAgent, user, logout } = useAuth();
  
  // Build navigation items based on auth state
  let allNavItems: Array<{ path: string; icon: any; label: string; action?: () => void }> = [];
  
  if (isAuthenticated) {
    // Authenticated users see: Home, My Tickets, Draw, and optionally Admin/Agent
    if (isAgent) {
      // Agents see: Home, Agent Dashboard, Draw
      allNavItems = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/agent", icon: Ticket, label: "Agent" },
        { path: "/draw", icon: Trophy, label: "Draw" },
      ];
    } else {
      // Regular users see: Home, My Tickets, Draw, and optionally Admin
      allNavItems = [...navItems];
      if (isAdmin) {
        allNavItems.push({ path: "/admin", icon: User, label: "Admin" });
      }
    }
  } else {
    // Non-authenticated users see: Home, Login, Sign Up
    allNavItems = [
      { path: "/", icon: Home, label: "Home" },
      { path: "/login", icon: LogIn, label: "Login" },
      { path: "/register", icon: UserPlus, label: "Sign Up" },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full group"
            >
              <div className="relative flex flex-col items-center gap-1">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-3 rounded-2xl gradient-primary opacity-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

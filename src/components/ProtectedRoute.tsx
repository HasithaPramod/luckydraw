import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireAgent?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireAgent = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isAgent } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page, saving the attempted location
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect non-admin users away from admin routes
    return <Navigate to="/" replace />;
  }

  if (requireAgent && !isAgent) {
    // Redirect non-agent users away from agent routes
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

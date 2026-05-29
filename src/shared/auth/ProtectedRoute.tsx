import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { UserRole } from "@/features/auth/types";

export function ProtectedRoute({ allow }: { allow?: UserRole[] }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
}

export function BuyerOnlyRoute() {
  return <ProtectedRoute allow={["buyer"]} />;
}

export function AdminOnlyRoute() {
  return <ProtectedRoute allow={["admin"]} />;
}

import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { UserRole } from "@/features/auth/types";

export function ProtectedRoute({ allow, unauthenticatedTo = "/login" }: { allow?: UserRole[]; unauthenticatedTo?: string }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to={unauthenticatedTo} replace state={{ from: location.pathname }} />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
}

export function BuyerOnlyRoute() {
  return <ProtectedRoute allow={["buyer"]} unauthenticatedTo="/login" />;
}

export function AdminOnlyRoute() {
  return <ProtectedRoute allow={["admin"]} unauthenticatedTo="/admin/login" />;
}

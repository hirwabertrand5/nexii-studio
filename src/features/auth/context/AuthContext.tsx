import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types";
import { apiLogout, apiMe, apiGoogleLogin, apiUpdateMe, apiAdminLogin } from "../api/authApi";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  adminLogin(input: { email: string; password: string }): Promise<AuthUser>;
  googleLogin(token: string): Promise<AuthUser>;
  updateProfile(input: { fullName?: string; country?: string | null; avatarUrl?: string | null }): Promise<AuthUser>;
  logout(): Promise<void>;
  refresh(): Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    const res = await apiMe();
    if (!res) {
      setUser(null);
      return null;
    }
    setUser(res.user);
    return res.user;
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(() => {
    return {
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      async googleLogin(token: string) {
        // send token to server for verification; server will set cookies
        const res = await apiGoogleLogin(token);
        setUser(res.user);
        return res.user;
      },
      async adminLogin(input) {
        const res = await apiAdminLogin(input);
        setUser(res.user);
        return res.user;
      },
      async updateProfile(input) {
        const res = await apiUpdateMe(input);
        setUser(res.user);
        return res.user;
      },
      async logout() {
        try {
          await apiLogout();
        } catch {
          // ignore
        }
        setUser(null);
      },
      refresh
    };
  }, [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

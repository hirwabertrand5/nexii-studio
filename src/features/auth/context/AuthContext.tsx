import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types";
import { apiLogin, apiLogout, apiMe, apiRegister } from "../api/authApi";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(input: { email: string; password: string }): Promise<AuthUser>;
  register(input: { fullName: string; email: string; password: string; country?: string }): Promise<AuthUser>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "nexii.auth.token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const res = await apiMe(token);
    setUser(res.user);
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
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
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      async login(input) {
        const res = await apiLogin(input);
        localStorage.setItem(STORAGE_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      },
      async register(input) {
        const res = await apiRegister(input);
        localStorage.setItem(STORAGE_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      },
      async logout() {
        const current = token;
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
        if (current) {
          try {
            await apiLogout(current);
          } catch {
            // ignore
          }
        }
      },
      refresh
    };
  }, [isLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


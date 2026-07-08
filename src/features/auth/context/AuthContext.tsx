import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types";
import { apiLoginChallenge, apiLoginVerify, apiLogout, apiMe, apiRegisterChallenge, apiRegisterVerify, apiGoogleLogin, apiUpdateMe, apiAdminLogin } from "../api/authApi";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(input: { email: string }): Promise<AuthUser>;
  adminLogin(input: { email: string; password: string }): Promise<AuthUser>;
  googleLogin(token: string): Promise<AuthUser>;
  register(input: { fullName: string; email: string; country?: string }): Promise<AuthUser>;
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
      async login(input) {
        // Step 1: ask server for challenge
        const challengeRes = await apiLoginChallenge({ email: input.email });
        const options = challengeRes.options;
        const userId = challengeRes.userId;

        // Step 2: trigger native auth prompt
        const assertion = await startAuthentication(options);

        // Step 3: verify with server (server will set cookies)
        const res = await apiLoginVerify({ ...assertion, id: userId });

        // Step 4: refresh user state
        setUser(res.user);
        return res.user;
      },
      async adminLogin(input) {
        const res = await apiAdminLogin(input);
        setUser(res.user);
        return res.user;
      },
      async register(input) {
        const challengeRes = await apiRegisterChallenge({ fullName: input.fullName, email: input.email, country: input.country });
        const options = challengeRes.options;
        const userId = challengeRes.userId;

        const attestation = await startRegistration(options);
        const res = await apiRegisterVerify({ ...attestation, id: userId });

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

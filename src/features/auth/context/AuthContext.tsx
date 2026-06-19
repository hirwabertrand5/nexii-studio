import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types";
import { apiLoginChallenge, apiLoginVerify, apiLogout, apiMe, apiRegisterChallenge, apiRegisterVerify, apiGoogleLogin } from "../api/authApi";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(input: { email: string }): Promise<AuthUser>;
  googleLogin(token: string): Promise<AuthUser>;
  register(input: { fullName: string; email: string }): Promise<AuthUser>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    const res = await apiMe();
    setUser(res.user);
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
        await apiGoogleLogin(token);
        await refresh();
        return user as AuthUser;
      },
      async login(input) {
        // Step 1: ask server for challenge
        const challengeRes = await apiLoginChallenge({ email: input.email });
        const options = challengeRes.options;
        const userId = challengeRes.userId;

        // Step 2: trigger native auth prompt
        const assertion = await startAuthentication(options);

        // Step 3: verify with server (server will set cookies)
        await apiLoginVerify({ ...assertion, id: userId });

        // Step 4: refresh user state
        await refresh();
        return user as AuthUser;
      },
      async register(input) {
        const challengeRes = await apiRegisterChallenge({ fullName: input.fullName, email: input.email });
        const options = challengeRes.options;
        const userId = challengeRes.userId;

        const attestation = await startRegistration(options);
        await apiRegisterVerify({ ...attestation, id: userId });

        await refresh();
        return user as AuthUser;
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


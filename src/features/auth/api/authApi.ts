import { http } from "@/shared/api/http";
import type { AuthUser } from "../types";

export async function apiMe() {
  try {
    return await http<{ user: AuthUser }>("/api/auth/me", { method: "GET" });
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as any).status === 401) {
      return null;
    }
    throw err;
  }
}

export async function apiAdminLogin(input: { email: string; password: string }) {
  return http<{ user: AuthUser }>("/api/auth/admin-login", { method: "POST", body: JSON.stringify(input) });
}

export async function apiUpdateMe(input: { fullName?: string; country?: string | null; avatarUrl?: string | null }) {
  return http<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function apiLogout() {
  return http<{ message: string }>("/api/auth/logout", { method: "POST" });
}

export async function apiGoogleLogin(idToken: string) {
  return http<{ user: AuthUser }>("/api/auth/google-login", { method: "POST", body: JSON.stringify({ idToken }) });
}

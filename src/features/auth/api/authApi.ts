import { http } from "@/shared/api/http";
import type { AuthUser } from "../types";

export type AuthResponse = { user: AuthUser; token: string };

export async function apiRegister(input: {
  fullName: string;
  email: string;
  password: string;
  country?: string;
}) {
  return http<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function apiLogin(input: { email: string; password: string }) {
  return http<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function apiMe(token: string) {
  return http<{ user: AuthUser }>("/api/auth/me", { method: "GET", token });
}

export async function apiLogout(token: string) {
  return http<{ message: string }>("/api/auth/logout", { method: "POST", token });
}

export async function apiForgotPassword(email: string) {
  return http<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}


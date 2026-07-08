import { http } from "@/shared/api/http";
import type { AuthUser } from "../types";

export async function apiRegisterChallenge(input: { fullName: string; email: string; country?: string }) {
  return http<any>("/api/auth/register-challenge", { method: "POST", body: JSON.stringify(input) });
}

export async function apiRegisterVerify(body: unknown) {
  return http<{ user: AuthUser }>("/api/auth/register-verify", { method: "POST", body: JSON.stringify(body) });
}

export async function apiLoginChallenge(input: { email: string }) {
  return http<any>("/api/auth/login-challenge", { method: "POST", body: JSON.stringify(input) });
}

export async function apiLoginVerify(body: unknown) {
  return http<{ user: AuthUser }>("/api/auth/login-verify", { method: "POST", body: JSON.stringify(body) });
}

export async function apiMe() {
  return http<{ user: AuthUser }>("/api/auth/me", { method: "GET" });
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

export async function apiForgotPassword(email: string) {
  return http<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function apiGoogleLogin(idToken: string) {
  return http<{ user: AuthUser }>("/api/auth/google-login", { method: "POST", body: JSON.stringify({ idToken }) });
}

import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { sendMessage, sendSuccess } from "../utils/apiResponse.js";

function sanitizeUser(u: { _id: unknown; fullName: string; email: string; role: "buyer" | "admin"; country?: string | null; createdAt?: Date }) {
  return {
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    country: u.country ?? null,
    createdAt: u.createdAt ?? null
  };
}

export async function register(req: Request, res: Response) {
  const { fullName, email, password, country } = req.body ?? {};
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "fullName, email, and password are required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) return res.status(409).json({ success: false, message: "Email already in use" });

  const user = await User.create({
    fullName: String(fullName),
    email: String(email).toLowerCase(),
    password: String(password),
    country: country ? String(country) : undefined
  });

  const token = generateToken({ userId: String(user._id), role: user.role });
  return sendSuccess(res, { user: sanitizeUser(user), token }, 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ success: false, message: "email and password are required" });

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const ok = await user.comparePassword(String(password));
  if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const token = generateToken({ userId: String(user._id), role: user.role });
  return sendSuccess(res, {
    user: sanitizeUser({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      country: user.country ?? null,
      createdAt: (user as any).createdAt
    }),
    token
  });
}

export async function me(req: Request, res: Response) {
  if (!req.auth) return res.status(401).json({ success: false, message: "Unauthorized" });
  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return sendSuccess(res, { user: sanitizeUser(user) });
}

export async function logout(_req: Request, res: Response) {
  // Token-based auth (localStorage) logout happens client-side.
  return sendMessage(res, "Logged out");
}

export async function forgotPassword(_req: Request, res: Response) {
  // Placeholder: wire email provider + token flow later.
  return sendMessage(res, "If that email exists, a reset link will be sent.");
}

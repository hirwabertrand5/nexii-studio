import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshToken } from "../models/RefreshToken.js";

export function generateAccessToken(params: { userId: string; role: "buyer" | "admin" }) {
  const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT access secret is not set");
  return jwt.sign({ userId: params.userId, role: params.role }, secret, { expiresIn: "15m" });
}

export async function createRefreshToken(userId: string, ip = "", deviceInfo = "") {
  const raw = crypto.randomBytes(64).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ tokenHash, user: userId, ip, deviceInfo, expiresAt });
  return raw;
}

export async function verifyRefreshToken(raw: string) {
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const doc = await RefreshToken.findOne({ tokenHash: hash }).populate("user");
  if (!doc) return null;
  if (doc.revoked) return null;
  if (doc.expiresAt < new Date()) return null;
  return doc;
}

export async function revokeRefreshToken(raw: string) {
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  await RefreshToken.updateOne({ tokenHash: hash }, { revoked: true }).exec();
}

export function verifyAccessToken(token: string) {
  const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT access secret is not set");
  return jwt.verify(token, secret) as { userId: string; role: "buyer" | "admin" };
}


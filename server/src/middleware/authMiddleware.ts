import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken, createRefreshToken, revokeRefreshToken, generateAccessToken } from "../utils/generateToken.js";
import { RefreshToken } from "../models/RefreshToken.js";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

async function tryRefresh(req: Request, res: Response, next: NextFunction) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) return res.status(401).json({ success: false, message: "Unauthorized" });

  const doc = await verifyRefreshToken(raw);
  if (!doc) return res.status(401).json({ success: false, message: "Invalid refresh token" });

  // rotate refresh token
  try {
    await revokeRefreshToken(raw);
  } catch {
    // ignore
  }

  const newRaw = await createRefreshToken(String((doc as any).user._id), req.ip, String(req.headers["user-agent"] ?? ""));
  const access = generateAccessToken({ userId: String((doc as any).user._id), role: (doc as any).user.role });

  res.cookie(ACCESS_COOKIE, access, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, newRaw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });

  req.auth = { userId: String((doc as any).user._id), role: (doc as any).user.role };
  return next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const access = req.cookies?.[ACCESS_COOKIE];
  if (!access) return tryRefresh(req, res, next);

  try {
    const decoded = verifyAccessToken(access);
    req.auth = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (err: any) {
    // token expired -> try refresh flow
    if (err && err.name === "TokenExpiredError") {
      return tryRefresh(req, res, next);
    }
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    // If admin, attach admin info
    if (req.auth?.role === "admin") {
      // admin lookup left intentionally lightweight — controllers can populate if needed
      (req as any).admin = { _id: req.auth.userId, role: "admin" } as any;
    }
    return next();
  });
}

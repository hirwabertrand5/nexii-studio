import type { Request, Response } from "express";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, createRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../utils/generateToken.js";
import { sendMessage, sendSuccess } from "../utils/apiResponse.js";
import { getAuthCookieOptions } from "../utils/cookieOptions.js";

function sanitizeUser(u: { _id: unknown; fullName: string; email: string; role: "buyer" | "admin"; country?: string | null; createdAt?: Date; avatarUrl?: string | null }) {
  return {
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    country: u.country ?? null,
    avatarUrl: (u as any).avatarUrl ?? null,
    createdAt: u.createdAt ?? null
  };
}

function getGoogleClientIds() {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.VITE_GOOGLE_CLIENT_ID
  ]
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function refreshTokenHandler(req: Request, res: Response) {
  const raw = req.cookies?.refresh_token;
  if (!raw) return res.status(401).json({ success: false, message: "Unauthorized" });

  const doc = await verifyRefreshToken(raw);
  if (!doc) return res.status(401).json({ success: false, message: "Invalid refresh token" });

  // rotate refresh token: revoke old and issue a new one
  await revokeRefreshToken(raw);
  const newRaw = await createRefreshToken(String((doc as any).user._id), req.ip, String(req.headers["user-agent"] ?? ""));
  const access = generateAccessToken({ userId: String((doc as any).user._id), role: (doc as any).user.role });

  res.cookie("access_token", access, getAuthCookieOptions(15 * 60 * 1000));

  res.cookie("refresh_token", newRaw, getAuthCookieOptions(7 * 24 * 60 * 60 * 1000));

  const user = await User.findById(String((doc as any).user._id));
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  return sendSuccess(res, { user: sanitizeUser(user) });
}

export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.refresh_token;
  if (raw) {
    try {
      await revokeRefreshToken(raw);
    } catch {
      // ignore
    }
  }

  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });

  return sendMessage(res, "Logged out");
}

export async function me(req: Request, res: Response) {
  if (!req.auth) return res.status(401).json({ success: false, message: "Unauthorized" });
  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  return sendSuccess(res, { user: sanitizeUser(user) });
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  if (user.accountStatus !== "active") {
    return res.status(403).json({ success: false, message: "Admin account is suspended" });
  }

  if (!user.password) {
    return res.status(400).json({ success: false, message: "Admin password is not configured" });
  }

  const passwordMatches = await bcrypt.compare(String(password), user.password);
  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const access = generateAccessToken({ userId: String(user._id), role: user.role });
  const refreshRaw = await createRefreshToken(String(user._id), req.ip, String(req.headers["user-agent"] ?? ""));

  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie("access_token", access, getAuthCookieOptions(accessMaxAge));

  res.cookie("refresh_token", refreshRaw, getAuthCookieOptions(refreshMaxAge));

  return sendSuccess(res, { user: sanitizeUser(user) });
}

export async function updateMe(req: Request, res: Response) {
  if (!req.auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { fullName, country, avatarUrl } = req.body ?? {};

  if (fullName !== undefined) {
    const nextFullName = String(fullName).trim();
    if (!nextFullName) {
      return res.status(400).json({ success: false, message: "fullName cannot be empty" });
    }
    user.fullName = nextFullName;
  }

  if (country !== undefined) {
    const nextCountry = country === null ? "" : String(country).trim();
    user.country = nextCountry || undefined;
  }

  if (avatarUrl !== undefined) {
    const nextAvatarUrl = avatarUrl === null ? "" : String(avatarUrl).trim();
    user.avatarUrl = nextAvatarUrl || undefined;
  }

  await user.save();

  return sendSuccess(res, { user: sanitizeUser(user) });
}

export async function forgotPassword(_req: Request, res: Response) {
  // Placeholder kept for compatibility with existing frontend flows
  return sendMessage(res, "If that email exists, a reset link will be sent.");
}

export async function googleLogin(req: Request, res: Response) {
  const { idToken } = req.body ?? {};
  if (!idToken) return res.status(400).json({ success: false, message: "idToken is required" });

  const clientIds = getGoogleClientIds();
  if (clientIds.length === 0) return res.status(500).json({ success: false, message: "Google client ID not configured on server" });

  const client = new OAuth2Client(clientIds[0]);
  let payload: any;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientIds });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid Google ID token" });
  }

  if (!payload || !payload.email || !payload.sub) return res.status(400).json({ success: false, message: "Invalid token payload" });

  const emailLc = String(payload.email).toLowerCase();
  const googleId = String(payload.sub);
  const name = payload.name ?? payload.given_name ?? "";
  const picture = payload.picture ?? undefined;

  // Lookup by googleId first
  let user = await User.findOne({ googleId });
  if (user) {
    // update avatar if available
    if (picture && user.avatarUrl !== picture) {
      user.avatarUrl = picture;
      await user.save();
    }
  } else {
    // find by email
    user = await User.findOne({ email: emailLc });
    if (user) {
      // Link googleId and update avatar
      user.googleId = googleId;
      if (picture) user.avatarUrl = picture;
      if (!user.fullName && name) user.fullName = name;
      await user.save();
    } else {
      // create new user
      user = await User.create({ fullName: name || emailLc.split("@")[0], email: emailLc, googleId, avatarUrl: picture, role: "buyer" });
    }
  }

  // Issue cookies (access + refresh) same as other flows
  const access = generateAccessToken({ userId: String(user._id), role: user.role });
  const refreshRaw = await createRefreshToken(String(user._id), req.ip, String(req.headers["user-agent"] ?? ""));

  const accessMaxAge = 15 * 60 * 1000; // 15 minutes
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie("access_token", access, getAuthCookieOptions(accessMaxAge));

  res.cookie("refresh_token", refreshRaw, getAuthCookieOptions(refreshMaxAge));

  return sendSuccess(res, { user: sanitizeUser(user) });
}

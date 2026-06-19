import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, createRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../utils/generateToken.js";
import { sendMessage, sendSuccess } from "../utils/apiResponse.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

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

function getRpId(req: Request) {
  return process.env.WEBAUTHN_RP_ID ?? process.env.RP_ID ?? req.hostname;
}

function getOrigin(req: Request) {
  return process.env.WEBAUTHN_ORIGIN ?? process.env.CORS_ORIGIN?.split(",")[0] ?? `${req.protocol}://${req.get("host")}`;
}

export async function registerChallenge(req: Request, res: Response) {
  const { fullName, email } = req.body ?? {};
  if (!fullName || !email) return res.status(400).json({ success: false, message: "fullName and email are required" });

  const emailLc = String(email).toLowerCase();
  let user = await User.findOne({ email: emailLc });
  if (!user) {
    user = await User.create({ fullName: String(fullName), email: emailLc });
  }

  const rpID = getRpId(req);
  const options = generateRegistrationOptions({
    rpName: process.env.WEBAUTHN_RP_NAME ?? "Nexii Studio",
    rpID,
    userID: String(user._id),
    userName: user.email,
    attestation: "none",
    authenticatorSelection: { userVerification: "preferred" }
  } as any);

  user.currentChallenge = options.challenge;
  await user.save();
  return sendSuccess(res, { options, userId: String(user._id) } as any);
}

export async function registerVerify(req: Request, res: Response) {
  const body = req.body ?? {};
  const { id: userId } = body ?? {};
  if (!userId) return res.status(400).json({ success: false, message: "user id required" });

  const user = await User.findById(String(userId));
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const expectedOrigin = getOrigin(req);
  const rpID = getRpId(req);

  const verification = await verifyRegistrationResponse({ response: body, expectedChallenge: user.currentChallenge ?? "", expectedOrigin, expectedRPID: rpID } as any);

  if (!verification.verified) return res.status(400).json({ success: false, message: "Registration verification failed" });

  const regInfo = verification.registrationInfo;
  if (!regInfo) return res.status(500).json({ success: false, message: "Missing registrationInfo" });

  // Store credential using base64/base64url encodings
  const credentialID = Buffer.from(regInfo.credentialID).toString("base64url");
  const credentialPublicKey = Buffer.from(regInfo.credentialPublicKey).toString("base64");
  user.credentials = user.credentials ?? [];
  user.credentials.push({ credentialID, credentialPublicKey, counter: regInfo.counter, transports: (body?.transports as string[]) ?? [] });
  user.currentChallenge = undefined;
  await user.save();

  // Issue cookies (access + refresh)
  const access = generateAccessToken({ userId: String(user._id), role: user.role });
  const refreshRaw = await createRefreshToken(String(user._id), req.ip, String(req.headers["user-agent"] ?? ""));

  // Cookie settings: access short-lived, refresh long-lived
  const accessMaxAge = 15 * 60 * 1000; // 15 minutes
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: accessMaxAge
  });

  res.cookie("refresh_token", refreshRaw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: refreshMaxAge
  });

  return sendSuccess(res, { user: sanitizeUser(user) });
}

export async function loginChallenge(req: Request, res: Response) {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ success: false, message: "email is required" });

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!user.credentials || user.credentials.length === 0) return res.status(400).json({ success: false, message: "No credentials registered for this user" });

  const rpID = getRpId(req);
  const allowCredentials = user.credentials.map(c => ({ id: c.credentialID, type: "public-key", transports: c.transports }));
  const options = generateAuthenticationOptions({ rpID, allowCredentials, userVerification: "preferred" });

  user.currentChallenge = options.challenge;
  await user.save();

  return sendSuccess(res, { options, userId: String(user._id) } as any);
}

export async function loginVerify(req: Request, res: Response) {
  const body = req.body ?? {};
  const { id: userId } = body ?? {};
  if (!userId) return res.status(400).json({ success: false, message: "user id required" });

  const user = await User.findById(String(userId));
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const rpID = getRpId(req);
  const expectedOrigin = getOrigin(req);

  // Find credential used
  const credId = (body?.id as string) ?? (body?.rawId as string) ?? undefined;
  const credential = user.credentials.find(c => c.credentialID === credId);
  if (!credential) return res.status(400).json({ success: false, message: "Unknown credential" });

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: user.currentChallenge ?? "",
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(credential.credentialID, "base64url"),
      credentialPublicKey: Buffer.from(credential.credentialPublicKey, "base64"),
      counter: credential.counter
    }
  } as any);

  if (!verification.verified) return res.status(401).json({ success: false, message: "Authentication failed" });

  // update counter
  credential.counter = verification.authenticationInfo.newCounter;
  user.currentChallenge = undefined;
  await user.save();

  // Issue cookies
  const access = generateAccessToken({ userId: String(user._id), role: user.role });
  const refreshRaw = await createRefreshToken(String(user._id), req.ip, String(req.headers["user-agent"] ?? ""));

  const accessMaxAge = 15 * 60 * 1000; // 15 minutes
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: accessMaxAge
  });

  res.cookie("refresh_token", refreshRaw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: refreshMaxAge
  });

  return sendSuccess(res, { user: sanitizeUser(user) });
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

  res.cookie("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60 * 1000
  });

  res.cookie("refresh_token", newRaw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

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

export async function forgotPassword(_req: Request, res: Response) {
  // Placeholder kept for compatibility with existing frontend flows
  return sendMessage(res, "If that email exists, a reset link will be sent.");
}

export async function googleLogin(req: Request, res: Response) {
  const { idToken } = req.body ?? {};
  if (!idToken) return res.status(400).json({ success: false, message: "idToken is required" });

  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ success: false, message: "Google client ID not configured on server" });

  const client = new OAuth2Client(clientId);
  let payload: any;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
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

  res.cookie("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: accessMaxAge
  });

  res.cookie("refresh_token", refreshRaw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: refreshMaxAge
  });

  return sendSuccess(res, { user: sanitizeUser(user) });
}

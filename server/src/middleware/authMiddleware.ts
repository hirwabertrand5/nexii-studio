import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: "Server misconfigured" });

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; role: "buyer" | "admin" };
    req.auth = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: "Server misconfigured" });

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; role: "buyer" | "admin" };
    req.auth = { userId: decoded.userId, role: decoded.role };

    // If admin, fetch admin user details
    if (decoded.role === "admin") {
      const admin = await User.findById(decoded.userId);
      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin user not found" });
      }
      (req as any).admin = { _id: admin._id, role: admin.role };
    }

    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

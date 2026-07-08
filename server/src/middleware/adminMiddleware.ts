import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (req.auth.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });
  return next();
}

export const adminMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) {
    throw new AppError("Unauthorized", 401);
  }

  if (req.auth.role !== "admin") {
    throw new AppError("Admin access required", 403);
  }

  const admin = await User.findById(req.auth.userId).select("role accountStatus");
  if (!admin) {
    throw new AppError("Unauthorized", 401);
  }

  if (admin.role !== "admin") {
    throw new AppError("Admin access required", 403);
  }

  if (admin.accountStatus !== "active") {
    throw new AppError("Admin account is suspended", 403);
  }

  (req as any).admin = { _id: admin._id, role: "admin" } as any;

  return next();
});

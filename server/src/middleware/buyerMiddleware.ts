import type { Request, Response, NextFunction } from "express";

export function requireBuyer(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (req.auth.role !== "buyer") {
    return res.status(403).json({ success: false, message: "Buyer access required" });
  }

  return next();
}

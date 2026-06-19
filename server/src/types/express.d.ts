import "express";
import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: "buyer" | "admin" };
      admin?: { _id: Types.ObjectId; role: "admin" };
      rawBody?: Buffer;
      // cookies provided by cookie-parser
      cookies?: Record<string, string>;
    }
  }
}

export {};

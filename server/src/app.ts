import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/authRoutes.js";
import { planRoutes } from "./routes/planRoutes.js";
import { wishlistRoutes } from "./routes/wishlistRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { adminOrderRoutes } from "./routes/adminOrderRoutes.js";
import { downloadRoutes } from "./routes/downloadRoutes.js";
import { paymentRoutes } from "./routes/paymentRoutes.js";
import { webhookRoutes } from "./routes/webhookRoutes.js";
import { adminTransactionRoutes } from "./routes/adminTransactionRoutes.js";
import { adminDashboardRoutes } from "./routes/adminDashboardRoutes.js";
import { adminPlanRoutes } from "./routes/adminPlanRoutes.js";
import { adminPaymentRoutes } from "./routes/adminPaymentRoutes.js";
import { adminUserRoutes } from "./routes/adminUserRoutes.js";
import { adminCustomRequestRoutes } from "./routes/adminCustomRequestRoutes.js";
import { requestRoutes } from "./routes/requestRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { loginLimiter, apiLimiter } from "./middleware/rateLimitMiddleware.js";

dotenv.config();

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
  const allowedOrigins = corsOrigin.split(",").map((url) => url.trim());
  console.log("[server] CORS allowed origins:", allowedOrigins);

  app.use(cors({
    origin: (origin, callback) => {
      // If no origin (e.g., curl, server-to-server), allow
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400 // 24 hours
  }));

  // Rate limiting
  app.use("/api/", apiLimiter);

  app.use(express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = Buffer.from(buf);
    }
  }));

  app.get("/health", (_req, res) => res.json({ success: true, data: { ok: true } }));

  // Cookie parser for access/refresh cookies
  app.use(cookieParser());

  // Auth routes with stricter rate limiting
  app.use("/api/auth", loginLimiter, authRoutes);
  
  // Other API routes
  app.use("/api/plans", planRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin/orders", adminOrderRoutes);
  app.use("/api/downloads", downloadRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/webhooks", webhookRoutes);
  app.use("/api/admin/transactions", adminTransactionRoutes);
  app.use("/api/admin/dashboard", adminDashboardRoutes);
  app.use("/api/admin/plans", adminPlanRoutes);
  app.use("/api/admin/payments", adminPaymentRoutes);
  app.use("/api/admin/users", adminUserRoutes);
  app.use("/api/admin/requests", adminCustomRequestRoutes);
  app.use("/api/requests", requestRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

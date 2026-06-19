import { Router } from "express";
import {
  flutterwaveWebhook,
  getMyTransactions,
  initializeFlutterwave,
  initializePaystack,
  paystackWebhook,
  verifyFlutterwave,
  verifyPaystack
} from "../controllers/paymentController.js";
import {
  createStripeIntent,
  createPayPalOrder,
  capturePayPalOrderController
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireBuyer } from "../middleware/buyerMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const paymentRoutes = Router();

paymentRoutes.post("/paystack/initialize", requireAuth, requireBuyer, asyncHandler(initializePaystack));
paymentRoutes.get("/paystack/verify/:reference", asyncHandler(verifyPaystack));
paymentRoutes.post("/paystack/webhook", asyncHandler(paystackWebhook));

// Stripe & PayPal endpoints for checkout initiation
paymentRoutes.post("/stripe/create-intent", requireAuth, requireBuyer, asyncHandler(createStripeIntent));

paymentRoutes.post("/paypal/create-order", requireAuth, requireBuyer, asyncHandler(createPayPalOrder));
paymentRoutes.post("/paypal/capture-order", requireAuth, requireBuyer, asyncHandler(capturePayPalOrderController));

paymentRoutes.post("/flutterwave/initialize", requireAuth, requireBuyer, asyncHandler(initializeFlutterwave));
paymentRoutes.get("/flutterwave/verify/:transactionId", asyncHandler(verifyFlutterwave));
paymentRoutes.post("/flutterwave/webhook", asyncHandler(flutterwaveWebhook));

paymentRoutes.get("/my-transactions", requireAuth, requireBuyer, asyncHandler(getMyTransactions));

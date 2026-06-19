import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendMessage } from "../utils/apiResponse.js";
import {
  constructStripeEvent,
  handleStripeWebhook
} from "../services/stripeService.js";
import { verifyPayPalWebhookSignature, handlePayPalWebhook } from "../services/paypalService.js";
import { verifyPaystackWebhookSignature, handlePaystackWebhook } from "../services/paystackService.js";
import { verifyFlutterwaveWebhookSignature, handleFlutterwaveWebhook } from "../services/flutterwaveService.js";

export const webhookRoutes = Router();

// Stripe webhook
webhookRoutes.post(
  "/stripe",
  asyncHandler(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event: any;
    try {
      event = constructStripeEvent(req.rawBody, sig);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid Stripe signature" });
    }

    await handleStripeWebhook(event);
    return sendMessage(res, "Stripe webhook processed");
  })
);

// PayPal webhook
webhookRoutes.post(
  "/paypal",
  asyncHandler(async (req, res) => {
    const ok = await verifyPayPalWebhookSignature(req.rawBody, req.headers as Record<string, unknown>);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid PayPal signature" });

    await handlePayPalWebhook(req.body ?? {});
    return sendMessage(res, "PayPal webhook processed");
  })
);

// Paystack webhook
webhookRoutes.post(
  "/paystack",
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-paystack-signature"];
    if (!verifyPaystackWebhookSignature(req.rawBody, signature)) {
      return res.status(401).json({ success: false, message: "Invalid Paystack signature" });
    }

    await handlePaystackWebhook(req.body ?? {});
    return sendMessage(res, "Paystack webhook processed");
  })
);

// Flutterwave webhook
webhookRoutes.post(
  "/flutterwave",
  asyncHandler(async (req, res) => {
    const signature = req.headers["flutterwave-signature"];
    const legacyHash = req.headers["verif-hash"];
    if (!verifyFlutterwaveWebhookSignature(req.rawBody, signature, legacyHash)) {
      return res.status(401).json({ success: false, message: "Invalid Flutterwave signature" });
    }

    await handleFlutterwaveWebhook(req.body ?? {});
    return sendMessage(res, "Flutterwave webhook processed");
  })
);

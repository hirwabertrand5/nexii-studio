import type { Request, Response } from "express";
import {
  handlePaystackWebhook,
  initializePaystackPayment,
  verifyPaystackPayment,
  verifyPaystackWebhookSignature
} from "../services/paystackService.js";
import {
  handleFlutterwaveWebhook,
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
  verifyFlutterwaveWebhookSignature
} from "../services/flutterwaveService.js";
import { getBuyerTransactions } from "../services/paymentVerificationService.js";
import { initializeStripePayment, constructStripeEvent, handleStripeWebhook } from "../services/stripeService.js";
import {
  createPayPalOrder as createPayPalOrderService,
  capturePayPalOrder as capturePayPalOrderService,
  verifyPayPalWebhookSignature as verifyPayPalWebhookSignatureService,
  handlePayPalWebhook as handlePayPalWebhookService
} from "../services/paypalService.js";
import { sendMessage, sendSuccess } from "../utils/apiResponse.js";
import { requiredString, routeParam } from "../utils/validators.js";

function bodyOrderId(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  return requiredString(input.orderId, "orderId");
}

export async function initializePaystack(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const orderId = bodyOrderId(req.body);
  const payment = await initializePaystackPayment(orderId, userId);
  return sendSuccess(res, { payment }, 201);
}

export async function verifyPaystack(req: Request, res: Response) {
  const reference = routeParam(req.params.reference, "reference");
  const result = await verifyPaystackPayment(reference);
  return sendSuccess(res, result);
}

export async function paystackWebhook(req: Request, res: Response) {
  const signature = req.headers["x-paystack-signature"];
  if (!verifyPaystackWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ success: false, message: "Invalid Paystack signature" });
  }

  await handlePaystackWebhook(req.body ?? {});
  return sendMessage(res, "Paystack webhook processed");
}

export async function initializeFlutterwave(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const orderId = bodyOrderId(req.body);
  const payment = await initializeFlutterwavePayment(orderId, userId);
  return sendSuccess(res, { payment }, 201);
}

export async function verifyFlutterwave(req: Request, res: Response) {
  const transactionId = routeParam(req.params.transactionId, "transaction id");
  const result = await verifyFlutterwavePayment(transactionId);
  return sendSuccess(res, result);
}

export async function flutterwaveWebhook(req: Request, res: Response) {
  const signature = req.headers["flutterwave-signature"];
  const legacyHash = req.headers["verif-hash"];
  if (!verifyFlutterwaveWebhookSignature(req.rawBody, signature, legacyHash)) {
    return res.status(401).json({ success: false, message: "Invalid Flutterwave signature" });
  }

  await handleFlutterwaveWebhook(req.body ?? {});
  return sendMessage(res, "Flutterwave webhook processed");
}

export async function getMyTransactions(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const transactions = await getBuyerTransactions(userId);
  return sendSuccess(res, { transactions });
}

export async function createStripeIntent(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const orderId = bodyOrderId(req.body);
  const payment = await initializeStripePayment(orderId, userId);
  return sendSuccess(res, { payment }, 201);
}

export async function createPayPalOrder(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const orderId = bodyOrderId(req.body);
  const payment = await createPayPalOrderService(orderId, userId);
  return sendSuccess(res, { payment }, 201);
}

export async function capturePayPalOrderController(req: Request, res: Response) {
  const paypalOrderId = requiredString((req.body ?? {}).paypalOrderId, "paypalOrderId");
  const result = await capturePayPalOrderService(paypalOrderId);
  return sendSuccess(res, result);
}

// Expose webhook handlers when needed (also available under /api/webhooks)
export async function stripeWebhookHandler(req: Request, res: Response) {
  try {
    const sig = req.headers["stripe-signature"];
    const event = constructStripeEvent(req.rawBody, sig);
    await handleStripeWebhook(event);
    return sendMessage(res, "Stripe webhook processed");
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid Stripe signature" });
  }
}

export async function paypalWebhookHandler(req: Request, res: Response) {
  try {
    const ok = await verifyPayPalWebhookSignatureService(req.rawBody, req.headers as Record<string, unknown>);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid PayPal signature" });

    await handlePayPalWebhookService(req.body ?? {});
    return sendMessage(res, "PayPal webhook processed");
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid PayPal signature" });
  }
}

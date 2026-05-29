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

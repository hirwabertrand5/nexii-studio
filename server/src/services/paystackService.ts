import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import {
  amountToMinorUnits,
  applyPaymentOutcome,
  assertOrderPayable,
  createPendingTransaction,
  normalizePaidAmountFromMinorUnits
} from "./paymentVerificationService.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new AppError("Paystack is not configured", 500);
  return key;
}

function callbackUrl(orderId: string) {
  const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
  return `${baseUrl}/payment/success?gateway=paystack&orderId=${orderId}`;
}

async function paystackRequest<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await res.json().catch(() => null) as T & { message?: string };
  if (!res.ok) {
    throw new AppError(payload?.message ?? "Paystack request failed", res.status >= 500 ? 502 : 400);
  }

  return payload;
}

export async function initializePaystackPayment(orderId: string, userId: string) {
  const order = await assertOrderPayable(orderId, userId);
  const user = order.user as unknown as { _id: unknown; fullName: string; email: string };
  const reference = `PSK-${order.transactionReference}`;

  const payload = await paystackRequest<{
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      amount: amountToMinorUnits(order.totalAmount, order.currency),
      currency: order.currency,
      reference,
      callback_url: callbackUrl(String(order._id)),
      metadata: {
        orderId: String(order._id),
        userId,
        source: "nexii-studio"
      }
    })
  });

  if (!payload.status || !payload.data?.authorization_url) {
    throw new AppError(payload.message ?? "Unable to initialize Paystack payment", 502);
  }

  await createPendingTransaction({
    userId,
    orderId: String(order._id),
    gateway: "paystack",
    reference,
    amount: order.totalAmount,
    currency: order.currency,
    authorizationUrl: payload.data.authorization_url,
    rawGatewayResponse: payload
  });

  await order.updateOne({
    paymentGateway: "paystack",
    paymentReference: reference,
    verificationStatus: "pending"
  });

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code,
    reference: payload.data.reference,
    orderId: String(order._id)
  };
}

export async function verifyPaystackPayment(reference: string) {
  const payload = await paystackRequest<{
    status: boolean;
    message: string;
    data: {
      id: number;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at?: string;
      gateway_response?: string;
      receipt_number?: string;
      metadata?: { orderId?: string };
    };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  const data = payload.data;
  const isSuccessful = payload.status && data?.status === "success";

  return applyPaymentOutcome({
    orderId: data?.metadata?.orderId,
    reference,
    gateway: "paystack",
    status: isSuccessful ? "paid" : "failed",
    gatewayReference: data?.reference,
    providerTransactionId: data?.id ? String(data.id) : undefined,
    amount: normalizePaidAmountFromMinorUnits(data?.amount, data?.currency ?? "USD"),
    currency: data?.currency,
    receiptUrl: data?.receipt_number ? `paystack:${data.receipt_number}` : undefined,
    paymentDate: data?.paid_at ? new Date(data.paid_at) : undefined,
    failureReason: isSuccessful ? undefined : data?.gateway_response ?? payload.message,
    rawGatewayResponse: payload
  });
}

export function verifyPaystackWebhookSignature(rawBody: Buffer | undefined, signature: unknown) {
  if (!rawBody || typeof signature !== "string") return false;
  const hash = crypto.createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  if (hash.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function handlePaystackWebhook(event: Record<string, any>) {
  const eventType = event.event;
  if (eventType !== "charge.success" && eventType !== "charge.failed") {
    return { ignored: true };
  }

  const data = event.data ?? {};
  return applyPaymentOutcome({
    orderId: data.metadata?.orderId,
    reference: String(data.reference),
    gateway: "paystack",
    status: eventType === "charge.success" && data.status === "success" ? "paid" : "failed",
    gatewayReference: data.reference ? String(data.reference) : undefined,
    providerTransactionId: data.id ? String(data.id) : undefined,
    amount: normalizePaidAmountFromMinorUnits(data.amount, data.currency ?? "USD"),
    currency: data.currency,
    receiptUrl: data.receipt_number ? `paystack:${data.receipt_number}` : undefined,
    paymentDate: data.paid_at ? new Date(data.paid_at) : undefined,
    failureReason: eventType === "charge.success" ? undefined : data.gateway_response,
    rawGatewayResponse: event
  });
}

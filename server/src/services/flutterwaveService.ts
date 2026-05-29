import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import {
  applyPaymentOutcome,
  assertOrderPayable,
  createPendingTransaction
} from "./paymentVerificationService.js";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

function getSecretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new AppError("Flutterwave is not configured", 500);
  return key;
}

function getWebhookSecret() {
  const key = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  if (!key) throw new AppError("Flutterwave webhook secret is not configured", 500);
  return key;
}

function redirectUrl(orderId: string) {
  const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
  return `${baseUrl}/payment/success?gateway=flutterwave&orderId=${orderId}`;
}

async function flutterwaveRequest<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${FLUTTERWAVE_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await res.json().catch(() => null) as T & { message?: string };
  if (!res.ok) {
    throw new AppError(payload?.message ?? "Flutterwave request failed", res.status >= 500 ? 502 : 400);
  }

  return payload;
}

export async function initializeFlutterwavePayment(orderId: string, userId: string) {
  const order = await assertOrderPayable(orderId, userId);
  const user = order.user as unknown as { _id: unknown; fullName: string; email: string };
  const reference = `FLW-${order.transactionReference}`;

  const payload = await flutterwaveRequest<{
    status: string;
    message: string;
    data: {
      link: string;
    };
  }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: reference,
      amount: order.totalAmount,
      currency: order.currency,
      redirect_url: redirectUrl(String(order._id)),
      customer: {
        email: user.email,
        name: user.fullName
      },
      customizations: {
        title: "NEXii Studio",
        description: `Architectural plan order ${order.transactionReference}`
      },
      meta: {
        orderId: String(order._id),
        userId
      }
    })
  });

  if (payload.status !== "success" || !payload.data?.link) {
    throw new AppError(payload.message ?? "Unable to initialize Flutterwave payment", 502);
  }

  await createPendingTransaction({
    userId,
    orderId: String(order._id),
    gateway: "flutterwave",
    reference,
    amount: order.totalAmount,
    currency: order.currency,
    authorizationUrl: payload.data.link,
    rawGatewayResponse: payload
  });

  await order.updateOne({
    paymentGateway: "flutterwave",
    paymentReference: reference,
    verificationStatus: "pending"
  });

  return {
    authorizationUrl: payload.data.link,
    reference,
    orderId: String(order._id)
  };
}

export async function verifyFlutterwavePayment(transactionId: string) {
  const payload = await flutterwaveRequest<{
    status: string;
    message: string;
    data: {
      id: number;
      tx_ref: string;
      flw_ref?: string;
      status: string;
      amount: number;
      currency: string;
      charged_amount?: number;
      app_fee?: number;
      created_at?: string;
      meta?: { orderId?: string };
      customer?: { email?: string };
    };
  }>(`/transactions/${encodeURIComponent(transactionId)}/verify`);

  const data = payload.data;
  const isSuccessful = payload.status === "success" && data?.status === "successful";

  return applyPaymentOutcome({
    orderId: data?.meta?.orderId,
    reference: String(data?.tx_ref ?? transactionId),
    gateway: "flutterwave",
    status: isSuccessful ? "paid" : "failed",
    gatewayReference: data?.flw_ref,
    providerTransactionId: data?.id ? String(data.id) : transactionId,
    amount: Number(data?.amount ?? 0),
    currency: data?.currency,
    paymentDate: data?.created_at ? new Date(data.created_at) : undefined,
    failureReason: isSuccessful ? undefined : payload.message,
    rawGatewayResponse: payload
  });
}

export function verifyFlutterwaveWebhookSignature(rawBody: Buffer | undefined, signature: unknown, legacyHash: unknown) {
  const secret = getWebhookSecret();

  if (typeof legacyHash === "string") {
    if (legacyHash.length !== secret.length) return false;
    return crypto.timingSafeEqual(Buffer.from(legacyHash), Buffer.from(secret));
  }

  if (!rawBody || typeof signature !== "string") return false;
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (hash.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function handleFlutterwaveWebhook(event: Record<string, any>) {
  const data = event.data ?? {};
  const eventType = event.event ?? event["event.type"];
  const reference = String(data.tx_ref ?? data.txRef ?? data.reference ?? "");
  if (!reference) return { ignored: true };

  if (eventType && !String(eventType).includes("charge") && !String(eventType).includes("transaction")) {
    return { ignored: true };
  }

  const isSuccessful = data.status === "successful" || data.status === "completed";

  return applyPaymentOutcome({
    orderId: data.meta?.orderId,
    reference,
    gateway: "flutterwave",
    status: isSuccessful ? "paid" : "failed",
    gatewayReference: data.flw_ref ?? data.flwRef,
    providerTransactionId: data.id ? String(data.id) : undefined,
    amount: Number(data.amount ?? 0),
    currency: data.currency,
    paymentDate: data.created_at ? new Date(data.created_at) : undefined,
    failureReason: isSuccessful ? undefined : data.processor_response,
    rawGatewayResponse: event
  });
}

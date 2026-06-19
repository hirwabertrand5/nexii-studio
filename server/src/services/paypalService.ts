import { AppError } from "../utils/AppError.js";
import {
  applyPaymentOutcome,
  assertOrderPayable,
  createPendingTransaction
} from "./paymentVerificationService.js";

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new AppError("PayPal is not configured", 500);

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const payload = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !payload?.access_token) throw new AppError("Unable to obtain PayPal access token", 502);
  return payload.access_token as string;
}

export async function createPayPalOrder(orderId: string, userId: string) {
  const order = await assertOrderPayable(orderId, userId);
  const reference = `PPL-${order.transactionReference}`;
  const accessToken = await getAccessToken();

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: reference,
        custom_id: String(order._id),
        amount: {
          currency_code: order.currency,
          value: order.totalAmount.toFixed(2)
        },
        description: `NEXii Studio order ${order.transactionReference}`
      }
    ],
    application_context: {
      return_url: `${process.env.FRONTEND_URL ?? "http://localhost:3001"}/payment/success?gateway=paypal&orderId=${order._id}`,
      cancel_url: `${process.env.FRONTEND_URL ?? "http://localhost:3001"}/payment/cancel`
    }
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !payload?.id) throw new AppError(payload?.message ?? "Unable to create PayPal order", 502);

  const approveLink = (payload.links ?? []).find((l: any) => l.rel === "approve")?.href;

  await createPendingTransaction({
    userId,
    orderId: String(order._id),
    gateway: "paypal",
    reference,
    amount: order.totalAmount,
    currency: order.currency,
    authorizationUrl: approveLink,
    rawGatewayResponse: payload
  });

  await order.updateOne({
    paymentGateway: "paypal",
    paymentReference: reference,
    verificationStatus: "pending"
  });

  return { orderId: String(order._id), paypalOrderId: payload.id, approveUrl: approveLink };
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new AppError(payload?.message ?? "Unable to capture PayPal order", 502);

  // Find purchase unit and capture
  const purchaseUnit = Array.isArray(payload.purchase_units) ? payload.purchase_units[0] : undefined;
  const capture = purchaseUnit?.payments?.captures?.[0] ?? payload?.purchase_units?.[0]?.payments?.captures?.[0] ?? payload?.payments?.captures?.[0];
  const status = capture?.status ?? payload.status;
  const customId = purchaseUnit?.custom_id ?? purchaseUnit?.payments?.captures?.[0]?.custom_id ?? undefined;

  const isSuccessful = String(status).toUpperCase() === "COMPLETED";
  const amount = capture?.amount?.value ? Number(capture.amount.value) : undefined;

  return applyPaymentOutcome({
    orderId: customId ?? undefined,
    reference: purchaseUnit?.reference_id ?? undefined,
    gateway: "paypal",
    status: isSuccessful ? "paid" : "failed",
    gatewayReference: capture?.id ?? undefined,
    providerTransactionId: capture?.id ?? undefined,
    amount,
    currency: capture?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code,
    paymentDate: isSuccessful ? new Date() : undefined,
    failureReason: isSuccessful ? undefined : payload?.message ?? "PayPal capture failed",
    rawGatewayResponse: payload
  });
}

export async function verifyPayPalWebhookSignature(rawBody: Buffer | undefined, headers: Record<string, unknown>) {
  const transmissionId = headers["paypal-transmission-id"] as string | undefined;
  const transmissionTime = headers["paypal-transmission-time"] as string | undefined;
  const certUrl = headers["paypal-cert-url"] as string | undefined;
  const authAlgo = headers["paypal-auth-algo"] as string | undefined;
  const transmissionSig = headers["paypal-transmission-sig"] as string | undefined;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
    throw new AppError("Missing PayPal webhook headers or configuration", 400);
  }

  const accessToken = await getAccessToken();

  const body = {
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: webhookId,
    webhook_event: rawBody ? JSON.parse(rawBody.toString()) : {}
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = (await res.json().catch(() => ({}))) as any;
  return payload?.verification_status === "SUCCESS";
}

export async function handlePayPalWebhook(event: Record<string, any>) {
  const eventType = event.event_type ?? event.eventType ?? (event.event && event.event.type) ?? undefined;
  if (!eventType) return { ignored: true };

  // Handle payment capture completed
  if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
    const resource = event.resource ?? event;
    const purchaseUnit = Array.isArray(resource.purchase_units) ? resource.purchase_units[0] : resource;
    const customId = purchaseUnit?.custom_id ?? resource?.custom_id ?? resource?.purchase_units?.[0]?.custom_id;
    const reference = purchaseUnit?.reference_id ?? resource?.reference_id ?? undefined;
    const capture = resource?.resource?.purchase_units?.[0]?.payments?.captures?.[0] ?? resource?.resource ?? resource?.payments?.captures?.[0];
    const status = capture?.status ?? resource?.status;
    const isSuccessful = String(status).toUpperCase() === "COMPLETED";
    const amount = capture?.amount?.value ? Number(capture.amount.value) : undefined;

    return applyPaymentOutcome({
      orderId: customId ?? undefined,
      reference,
      gateway: "paypal",
      status: isSuccessful ? "paid" : "failed",
      gatewayReference: capture?.id ?? undefined,
      providerTransactionId: capture?.id ?? undefined,
      amount,
      currency: capture?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code,
      paymentDate: isSuccessful ? new Date() : undefined,
      failureReason: isSuccessful ? undefined : "PayPal webhook indicates failure",
      rawGatewayResponse: event
    });
  }

  return { ignored: true };
}

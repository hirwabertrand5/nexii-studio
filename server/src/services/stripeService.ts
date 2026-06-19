import Stripe from "stripe";
import { AppError } from "../utils/AppError.js";
import {
  amountToMinorUnits,
  applyPaymentOutcome,
  assertOrderPayable,
  createPendingTransaction,
  normalizePaidAmountFromMinorUnits
} from "./paymentVerificationService.js";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new AppError("Stripe is not configured", 500);
  return new Stripe(key, { apiVersion: "2022-11-15" });
}

export async function initializeStripePayment(orderId: string, userId: string) {
  const stripe = getStripeClient();
  const order = await assertOrderPayable(orderId, userId);
  const reference = `STP-${order.transactionReference}`;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountToMinorUnits(order.totalAmount, order.currency),
    currency: String(order.currency).toLowerCase(),
    metadata: {
      orderId: String(order._id),
      userId,
      reference
    }
  });

  await createPendingTransaction({
    userId,
    orderId: String(order._id),
    gateway: "stripe",
    reference,
    amount: order.totalAmount,
    currency: order.currency,
    authorizationUrl: undefined,
    rawGatewayResponse: paymentIntent
  });

  await order.updateOne({
    paymentGateway: "stripe",
    paymentReference: reference,
    verificationStatus: "pending"
  });

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, orderId: String(order._id) };
}

export function constructStripeEvent(rawBody: Buffer | undefined, signature: unknown) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new AppError("Stripe webhook secret is not configured", 500);
  if (!rawBody || typeof signature !== "string") throw new AppError("Invalid Stripe webhook payload", 400);
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function handleStripeWebhook(event: any) {
  const type = event.type;
  if (type !== "payment_intent.succeeded" && type !== "payment_intent.payment_failed") return { ignored: true };

  const intent = event.data.object as any;
  const reference = intent.metadata?.reference ?? `STP-${intent.id}`;
  const orderId = intent.metadata?.orderId;
  const amount = normalizePaidAmountFromMinorUnits(intent.amount_received ?? intent.amount, intent.currency ?? "USD");
  const isSuccessful = type === "payment_intent.succeeded";

  return applyPaymentOutcome({
    orderId,
    reference,
    gateway: "stripe",
    status: isSuccessful ? "paid" : "failed",
    gatewayReference: intent.id,
    providerTransactionId: intent.id,
    amount,
    currency: (intent.currency ?? "USD").toUpperCase(),
    paymentDate: isSuccessful ? new Date((intent.created ?? Date.now()) * 1000) : undefined,
    failureReason: isSuccessful ? undefined : intent.last_payment_error?.message,
    rawGatewayResponse: event
  });
}

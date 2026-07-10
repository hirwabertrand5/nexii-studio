import Stripe from "stripe";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
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

type StripePaymentIntentLike = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created?: number;
  latest_charge?: string | { receipt_url?: string | null } | null;
  last_payment_error?: { message?: string | null } | null;
  metadata?: Record<string, string>;
};

async function finalizeStripePaymentIntent(intent: StripePaymentIntentLike, rawEvent?: unknown) {
  const reference = intent.metadata?.reference ?? `STP-${intent.id}`;
  const orderId = intent.metadata?.orderId;
  const amount = normalizePaidAmountFromMinorUnits(intent.amount, intent.currency ?? "USD");
  const status =
    intent.status === "succeeded"
      ? "paid"
      : intent.status === "canceled"
        ? "cancelled"
        : "failed";
  const isSuccessful = status === "paid";
  const receiptUrl =
    typeof intent.latest_charge === "object" && intent.latest_charge
      ? intent.latest_charge.receipt_url ?? undefined
      : undefined;

  console.log("[stripe] finalizing payment intent", {
    paymentIntentId: intent.id,
    orderId,
    reference,
    stripeStatus: intent.status,
    orderPaymentStatus: status
  });

  return applyPaymentOutcome({
    orderId,
    reference,
    gateway: "stripe",
    status,
    gatewayReference: intent.id,
    providerTransactionId: intent.id,
    amount,
    currency: (intent.currency ?? "USD").toUpperCase(),
    receiptUrl,
    paymentDate: isSuccessful ? new Date((intent.created ?? Date.now()) * 1000) : undefined,
    failureReason: isSuccessful ? undefined : intent.last_payment_error?.message ?? undefined,
    rawGatewayResponse: rawEvent ?? intent
  });
}

function isReusableStripeIntent(status: string) {
  return ["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(status);
}

export async function initializeStripePayment(orderId: string, userId: string) {
  const stripe = getStripeClient();
  const order = await assertOrderPayable(orderId, userId);
  const reference = `STP-${order.transactionReference}`;
  const amount = amountToMinorUnits(order.totalAmount, order.currency);
  const currency = String(order.currency).toLowerCase();

  const existingTransaction = await Transaction.findOne({
    order: order._id,
    gateway: "stripe",
    reference
  });

  if (existingTransaction?.providerTransactionId) {
    const existingIntent = await stripe.paymentIntents.retrieve(existingTransaction.providerTransactionId);
    const intentOrderId = existingIntent.metadata?.orderId;
    const intentUserId = existingIntent.metadata?.userId;
    const amountMatches = existingIntent.amount === amount;
    const currencyMatches = existingIntent.currency.toLowerCase() === currency;

    if (
      intentOrderId === String(order._id) &&
      intentUserId === userId &&
      amountMatches &&
      currencyMatches &&
      isReusableStripeIntent(existingIntent.status)
    ) {
      console.log("[stripe] reusing payment intent", {
        paymentIntentId: existingIntent.id,
        orderId: String(order._id),
        status: existingIntent.status
      });
      return {
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
        orderId: String(order._id),
        status: existingIntent.status
      };
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: String(order._id),
      userId,
      reference
    }
  });

  console.log("[stripe] created payment intent", {
    paymentIntentId: paymentIntent.id,
    orderId: String(order._id),
    status: paymentIntent.status,
    amount,
    currency
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

  await Transaction.updateOne(
    { reference },
    {
      gatewayReference: paymentIntent.id,
      providerTransactionId: paymentIntent.id
    },
    { runValidators: true }
  );

  await order.updateOne({
    paymentGateway: "stripe",
    paymentReference: reference,
    verificationStatus: "pending"
  });

  return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, orderId: String(order._id), status: paymentIntent.status };
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
  console.log("[stripe] webhook event received", {
    id: event.id,
    type
  });

  if (type === "payment_intent.succeeded" || type === "payment_intent.payment_failed" || type === "payment_intent.canceled") {
    return finalizeStripePaymentIntent(event.data.object as StripePaymentIntentLike, event);
  }

  if (type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (!paymentIntentId) return { ignored: true };

    const transaction = await Transaction.findOne({ providerTransactionId: paymentIntentId, gateway: "stripe" });
    if (!transaction) return { ignored: true };

    console.log("[stripe] applying refund", {
      paymentIntentId,
      orderId: String(transaction.order)
    });

    return applyPaymentOutcome({
      orderId: String(transaction.order),
      reference: transaction.reference,
      gateway: "stripe",
      status: "refunded",
      gatewayReference: paymentIntentId,
      providerTransactionId: paymentIntentId,
      amount: transaction.amount,
      currency: transaction.currency,
      receiptUrl: charge.receipt_url ?? undefined,
      rawGatewayResponse: event
    });
  }

  return { ignored: true };
}

export async function verifyStripePaymentIntent(paymentIntentId: string, userId: string, orderId?: string) {
  const stripe = getStripeClient();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const metadataOrderId = intent.metadata?.orderId;
  const metadataUserId = intent.metadata?.userId;

  if (!metadataOrderId || metadataUserId !== userId) {
    throw new AppError("Stripe payment does not belong to the current user", 403);
  }

  if (orderId && metadataOrderId !== orderId) {
    throw new AppError("Stripe payment does not belong to this order", 400);
  }

  const order = await Order.findById(metadataOrderId);
  if (!order) throw new AppError("Order not found", 404);

  if (intent.amount !== amountToMinorUnits(order.totalAmount, order.currency)) {
    throw new AppError("Stripe payment amount does not match the order", 400);
  }

  if (intent.currency.toUpperCase() !== order.currency.toUpperCase()) {
    throw new AppError("Stripe payment currency does not match the order", 400);
  }

  console.log("[stripe] verified payment intent status", {
    paymentIntentId: intent.id,
    orderId: metadataOrderId,
    status: intent.status
  });

  if (intent.status === "processing" || intent.status === "requires_action") {
    return { paymentIntent: intent, pending: true };
  }

  if (intent.status !== "succeeded") {
    throw new AppError(`Stripe payment is ${intent.status}`, 400);
  }

  return finalizeStripePaymentIntent(intent as StripePaymentIntentLike);
}

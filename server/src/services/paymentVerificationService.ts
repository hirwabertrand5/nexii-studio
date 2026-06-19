import { type SortOrder } from "mongoose";
import { Order, type PaymentGateway, type PaymentStatus } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import {
  assertValidObjectId,
  escapeRegex,
  optionalEnumValue,
  optionalString,
  toOptionalNumber
} from "../utils/validators.js";

type PaymentOutcome = {
  orderId?: string;
  reference: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayReference?: string;
  providerTransactionId?: string;
  amount?: number;
  currency?: string;
  receiptUrl?: string;
  paymentDate?: Date;
  failureReason?: string;
  rawGatewayResponse?: unknown;
};

type TransactionQuery = {
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  gateway?: unknown;
  status?: unknown;
  sort?: unknown;
};

const MAX_LIMIT = 50;

function buildTransactionSort(sort: unknown): Record<string, SortOrder> {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "amount-high-low":
      return { amount: -1, createdAt: -1 };
    case "amount-low-high":
      return { amount: 1, createdAt: -1 };
    case "latest":
    default:
      return { createdAt: -1 };
  }
}

export function amountToMinorUnits(amount: number, currency: string) {
  const zeroDecimalCurrencies = new Set(["JPY", "KRW"]);
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

export function normalizePaidAmountFromMinorUnits(amount: unknown, currency: string) {
  const parsed = Number(amount ?? 0);
  const zeroDecimalCurrencies = new Set(["JPY", "KRW"]);
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) return parsed;
  return parsed / 100;
}

export async function assertOrderPayable(orderId: string, userId: string) {
  assertValidObjectId(orderId, "order id");
  const order = await Order.findById(orderId).populate("user", "fullName email");

  if (!order) throw new AppError("Order not found", 404);
  if (String(order.user._id) !== userId) throw new AppError("You do not have access to this order", 403);
  if (order.paymentStatus === "paid") throw new AppError("Order has already been paid", 409);
  if (order.orderStatus === "cancelled") throw new AppError("Cancelled orders cannot be paid", 400);

  return order;
}

export async function createPendingTransaction(input: {
  userId: string;
  orderId: string;
  gateway: PaymentGateway;
  reference: string;
  amount: number;
  currency: string;
  authorizationUrl?: string;
  rawGatewayResponse?: unknown;
}) {
  return Transaction.findOneAndUpdate(
    { reference: input.reference },
    {
      $set: {
        user: input.userId,
        order: input.orderId,
        gateway: input.gateway,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        authorizationUrl: input.authorizationUrl,
        rawGatewayResponse: input.rawGatewayResponse
      }
    },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function applyPaymentOutcome(outcome: PaymentOutcome) {
  const transaction = await Transaction.findOne({ reference: outcome.reference });
  const orderId = outcome.orderId ?? transaction?.order;
  if (!orderId) throw new AppError("Payment reference is not linked to an order", 404);

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  if (outcome.amount !== undefined && Number(outcome.amount.toFixed(2)) !== Number(order.totalAmount.toFixed(2))) {
    outcome.status = "failed";
    outcome.failureReason = "Payment amount does not match order total";
  }

  if (outcome.currency && outcome.currency.toUpperCase() !== order.currency.toUpperCase()) {
    outcome.status = "failed";
    outcome.failureReason = "Payment currency does not match order currency";
  }

  const isPaid = outcome.status === "paid";
  const verificationStatus = isPaid ? "verified" : "failed";
  const paymentDate = outcome.paymentDate ?? (isPaid ? new Date() : undefined);

  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    {
      paymentGateway: outcome.gateway,
      paymentReference: outcome.gatewayReference ?? outcome.reference,
      paymentDate,
      receiptUrl: outcome.receiptUrl,
      verificationStatus,
      paymentStatus: outcome.status,
      orderStatus: isPaid ? "completed" : "processing",
      downloadAccess: isPaid
    },
    { new: true, runValidators: true }
  );

  const updatedTransaction = await Transaction.findOneAndUpdate(
    { reference: outcome.reference },
    {
      $set: {
        user: order.user,
        order: order._id,
        gateway: outcome.gateway,
        gatewayReference: outcome.gatewayReference,
        providerTransactionId: outcome.providerTransactionId,
        amount: order.totalAmount,
        currency: order.currency,
        status: outcome.status,
        receiptUrl: outcome.receiptUrl,
        failureReason: outcome.failureReason,
        verifiedAt: new Date(),
        rawGatewayResponse: outcome.rawGatewayResponse
      },
      $setOnInsert: {
        reference: outcome.reference
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  return {
    order: updatedOrder,
    transaction: updatedTransaction
  };
}

export async function getBuyerTransactions(userId: string) {
  return Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("order", "transactionReference totalAmount currency paymentStatus orderStatus downloadAccess")
    .lean();
}

export async function listAdminTransactions(query: TransactionQuery) {
  const page = Math.max(1, Math.trunc(toOptionalNumber(query.page, "page") ?? 1));
  const requestedLimit = Math.max(1, Math.trunc(toOptionalNumber(query.limit, "limit") ?? 20));
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  const gateway = optionalEnumValue(query.gateway, ["paystack", "flutterwave", "mobile-money", "stripe", "paypal", "bank-transfer"] as const, "gateway");
  const status = optionalEnumValue(query.status, ["pending", "paid", "failed", "refunded"] as const, "status");
  if (gateway) filter.gateway = gateway;
  if (status) filter.status = status;

  const search = optionalString(query.search);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const matchingUsers = await User.find({
      $or: [{ fullName: regex }, { email: regex }]
    }).select("_id");

    filter.$or = [
      { reference: regex },
      { gatewayReference: regex },
      { providerTransactionId: regex },
      { user: { $in: matchingUsers.map((user) => user._id) } }
    ];
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort(buildTransactionSort(query.sort))
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email country")
      .populate("order", "transactionReference totalAmount currency paymentStatus orderStatus")
      .lean(),
    Transaction.countDocuments(filter)
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getRevenueAnalytics() {
  const [summary] = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        successfulTransactions: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        failedTransactions: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } }
      }
    }
  ]);

  const monthlyRevenue = await Transaction.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          currency: "$currency"
        },
        revenue: { $sum: "$amount" },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 }
  ]);

  return {
    totalTransactions: summary?.totalTransactions ?? 0,
    successfulTransactions: summary?.successfulTransactions ?? 0,
    failedTransactions: summary?.failedTransactions ?? 0,
    totalRevenue: summary?.totalRevenue ?? 0,
    monthlyRevenue
  };
}

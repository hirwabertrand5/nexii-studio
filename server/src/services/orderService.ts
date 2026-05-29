import { type SortOrder } from "mongoose";
import {
  ORDER_STATUSES,
  Order,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus
} from "../models/Order.js";
import { HousePlan } from "../models/HousePlan.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import {
  assertValidObjectId,
  enumValue,
  escapeRegex,
  optionalBoolean,
  optionalEnumValue,
  optionalString,
  stringArray,
  toOptionalNumber
} from "../utils/validators.js";
import { toObjectId } from "./planService.js";

type CheckoutInput = {
  planIds?: unknown;
  plans?: unknown;
  paymentMethod?: unknown;
  currency?: unknown;
};

type AdminOrderQuery = {
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  paymentStatus?: unknown;
  orderStatus?: unknown;
  sort?: unknown;
};

const MAX_LIMIT = 50;
const SUPPORTED_CURRENCIES = ["USD", "NGN", "GHS", "KES", "RWF", "UGX", "TZS", "ZAR"] as const;

function generateTransactionReference() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `NEXII-${Date.now()}-${random}`;
}

function parseCurrency(value: unknown) {
  if (value === undefined || value === null || value === "") return "USD";
  const currency = String(value).trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number])) {
    throw new AppError(`currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`, 400);
  }
  return currency;
}

function buildOrderSort(sort: unknown): Record<string, SortOrder> {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "amount-high-low":
      return { totalAmount: -1, createdAt: -1 };
    case "amount-low-high":
      return { totalAmount: 1, createdAt: -1 };
    case "latest":
    default:
      return { createdAt: -1 };
  }
}

export function parseCheckoutInput(body: unknown) {
  const input = (body ?? {}) as CheckoutInput;
  const rawPlanIds = input.planIds ?? input.plans;
  const planIds = stringArray(rawPlanIds, "planIds", true);

  if (planIds.length === 0) {
    throw new AppError("At least one plan is required", 400);
  }

  const uniquePlanIds = [...new Set(planIds)];
  uniquePlanIds.forEach((id) => assertValidObjectId(id, "plan id"));

  return {
    planIds: uniquePlanIds,
    paymentMethod: enumValue(input.paymentMethod, PAYMENT_METHODS, "paymentMethod"),
    currency: parseCurrency(input.currency)
  };
}

export function parseOrderUpdateInput(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const update: {
    paymentStatus?: PaymentStatus;
    orderStatus?: OrderStatus;
    downloadAccess?: boolean;
  } = {};

  const paymentStatus = optionalEnumValue(input.paymentStatus, PAYMENT_STATUSES, "paymentStatus");
  const orderStatus = optionalEnumValue(input.orderStatus, ORDER_STATUSES, "orderStatus");
  const downloadAccess = optionalBoolean(input.downloadAccess, "downloadAccess");

  if (paymentStatus) update.paymentStatus = paymentStatus;
  if (orderStatus) update.orderStatus = orderStatus;
  if (downloadAccess !== undefined) update.downloadAccess = downloadAccess;

  if (Object.keys(update).length === 0) {
    throw new AppError("At least one valid order field is required", 400);
  }

  if (update.paymentStatus === "paid" && update.orderStatus === undefined) {
    update.orderStatus = "completed";
  }

  if (update.paymentStatus === "paid" && update.downloadAccess === undefined) {
    update.downloadAccess = true;
  }

  if (update.paymentStatus && update.paymentStatus !== "paid" && update.downloadAccess === undefined) {
    update.downloadAccess = false;
  }

  return update;
}

export async function createCheckoutOrder(userId: string, input: ReturnType<typeof parseCheckoutInput>) {
  const plans = await HousePlan.find({
    _id: { $in: input.planIds },
    status: "published"
  }).select("_id title price");

  if (plans.length !== input.planIds.length) {
    throw new AppError("One or more selected plans are unavailable", 400);
  }

  const orderPlans = plans.map((plan) => ({
    plan: plan._id,
    title: plan.title,
    price: plan.price
  }));

  const totalAmount = orderPlans.reduce((sum, item) => sum + item.price, 0);

  const order = await Order.create({
    user: toObjectId(userId),
    plans: orderPlans,
    totalAmount,
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending",
    orderStatus: "processing",
    downloadAccess: false,
    transactionReference: generateTransactionReference(),
    currency: input.currency
  });

  return Order.findById(order._id).populate("plans.plan", "title images previewImages category architecturalStyle");
}

export async function getBuyerOrders(userId: string) {
  return Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("plans.plan", "title images previewImages category architecturalStyle filesIncluded")
    .lean();
}

export async function getOrderByIdForUser(orderId: string, requester: { userId: string; role: "buyer" | "admin" }) {
  const order = await Order.findById(orderId)
    .populate("user", "fullName email country")
    .populate("plans.plan", "title images previewImages category architecturalStyle filesIncluded")
    .lean();

  if (!order) throw new AppError("Order not found", 404);

  if (requester.role !== "admin" && String(order.user._id) !== requester.userId) {
    throw new AppError("You do not have access to this order", 403);
  }

  return order;
}

export async function listAdminOrders(query: AdminOrderQuery) {
  const page = Math.max(1, Math.trunc(toOptionalNumber(query.page, "page") ?? 1));
  const requestedLimit = Math.max(1, Math.trunc(toOptionalNumber(query.limit, "limit") ?? 20));
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  const paymentStatus = optionalEnumValue(query.paymentStatus, PAYMENT_STATUSES, "paymentStatus");
  const orderStatus = optionalEnumValue(query.orderStatus, ORDER_STATUSES, "orderStatus");
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderStatus) filter.orderStatus = orderStatus;

  const search = optionalString(query.search);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const matchingUsers = await User.find({
      $or: [{ fullName: regex }, { email: regex }]
    }).select("_id");

    filter.$or = [
      { transactionReference: regex },
      { "plans.title": regex },
      { user: { $in: matchingUsers.map((user) => user._id) } }
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(buildOrderSort(query.sort))
      .skip(skip)
      .limit(limit)
      .populate("user", "fullName email country")
      .populate("plans.plan", "title images category architecturalStyle")
      .lean(),
    Order.countDocuments(filter)
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function updateAdminOrder(orderId: string, update: ReturnType<typeof parseOrderUpdateInput>) {
  const order = await Order.findByIdAndUpdate(orderId, update, {
    new: true,
    runValidators: true
  })
    .populate("user", "fullName email country")
    .populate("plans.plan", "title images category architecturalStyle");

  if (!order) throw new AppError("Order not found", 404);
  return order;
}

export async function getOrderAnalytics() {
  const [summary] = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        paidOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
        pendingOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] }
        }
      }
    }
  ]);

  const popularPlans = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $unwind: "$plans" },
    {
      $group: {
        _id: "$plans.plan",
        title: { $first: "$plans.title" },
        sales: { $sum: 1 },
        revenue: { $sum: "$plans.price" }
      }
    },
    { $sort: { sales: -1, revenue: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalOrders: summary?.totalOrders ?? 0,
    paidOrders: summary?.paidOrders ?? 0,
    pendingOrders: summary?.pendingOrders ?? 0,
    totalRevenue: summary?.totalRevenue ?? 0,
    popularPlans
  };
}

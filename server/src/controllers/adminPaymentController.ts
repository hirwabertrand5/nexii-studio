import { type Request, type Response } from "express";
import { Order } from "../models/Order.js";
import { AdminActivityLog } from "../models/AdminActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

// Get all orders with filters
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { paymentStatus, orderStatus, page = 1, limit = 10, sortBy = "createdAt" } = req.query;

  const filter: Record<string, unknown> = {};

  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderStatus) filter.orderStatus = orderStatus;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "fullName email country")
      .populate("plans.plan", "title price")
      .sort({ [String(sortBy)]: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter)
  ]);

  res.status(200).json(
    apiResponse(true, "Orders retrieved", {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  );
});

// Get order details
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "fullName email country phone")
    .populate("plans.plan", "title price description");

  if (!order) throw new AppError("Order not found", 404);

  res.status(200).json(apiResponse(true, "Order retrieved", order));
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  const validStatuses = ["processing", "completed", "cancelled"];
  if (!validStatuses.includes(orderStatus)) {
    throw new AppError(`Invalid order status. Must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  const oldStatus = order.orderStatus;
  order.orderStatus = orderStatus;
  await order.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "order-status-changed",
    targetModel: "Order",
    targetId: order._id,
    description: `Changed order status from ${oldStatus} to ${orderStatus}`,
    changes: {
      orderStatus: { before: oldStatus, after: orderStatus }
    }
  });

  res.status(200).json(apiResponse(true, "Order status updated", order));
});

// Toggle download access
export const toggleDownloadAccess = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  order.downloadAccess = !order.downloadAccess;
  await order.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "order-status-changed",
    targetModel: "Order",
    targetId: order._id,
    description: `${order.downloadAccess ? "Enabled" : "Disabled"} download access for order`
  });

  res.status(200).json(apiResponse(true, "Download access updated", order));
});

// Get order payment verification history
export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate("user", "fullName email");
  if (!order) throw new AppError("Order not found", 404);

  const verificationHistory = {
    orderId: order._id,
    user: order.user,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentGateway: order.paymentGateway,
    paymentDate: order.paymentDate,
    transactionReference: order.transactionReference,
    paymentReference: order.paymentReference,
    verificationStatus: order.verificationStatus,
    totalAmount: order.totalAmount,
    currency: order.currency,
    receiptUrl: order.receiptUrl,
    createdAt: order.createdAt
  };

  res.status(200).json(apiResponse(true, "Payment history retrieved", verificationHistory));
});

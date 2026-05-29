import { type Request, type Response } from "express";
import { User } from "../models/User.js";
import { HousePlan } from "../models/HousePlan.js";
import { Order } from "../models/Order.js";
import { CustomRequest } from "../models/CustomRequest.js";
import { Transaction } from "../models/Transaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

// Get dashboard overview metrics
export const getDashboardOverview = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalPlans,
    totalUsers,
    totalOrders,
    totalRevenue,
    pendingRequests,
    failedPayments
  ] = await Promise.all([
    HousePlan.countDocuments(),
    User.countDocuments({ role: "buyer" }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]),
    CustomRequest.countDocuments({ status: "pending" }),
    Order.countDocuments({ paymentStatus: "failed" })
  ]);

  const totalRevenueAmount = totalRevenue[0]?.total ?? 0;

  const overview = {
    totalPlans,
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenueAmount,
    pendingRequests,
    failedPayments
  };

  res.status(200).json(apiResponse(true, "Dashboard overview retrieved", overview));
});

// Get recent activity
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const [recentOrders, newUsers, newRequests, failedPayments] = await Promise.all([
    Order.find()
      .populate("user", "fullName email")
      .populate("plans.plan", "title price")
      .sort({ createdAt: -1 })
      .limit(5),
    User.find({ role: "buyer" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email country createdAt"),
    CustomRequest.find()
      .populate("client", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5),
    Order.find({ paymentStatus: "failed" })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const activity = {
    recentOrders,
    newUsers,
    newRequests,
    failedPayments
  };

  res.status(200).json(apiResponse(true, "Recent activity retrieved", activity));
});

// Get monthly revenue
export const getMonthlyRevenue = asyncHandler(async (req: Request, res: Response) => {
  const monthlyRevenue = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: {
          year: { $year: "$paymentDate" },
          month: { $month: "$paymentDate" }
        },
        revenue: { $sum: "$totalAmount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 }
  ]);

  res.status(200).json(apiResponse(true, "Monthly revenue retrieved", monthlyRevenue));
});

// Get sales statistics
export const getSalesStatistics = asyncHandler(async (req: Request, res: Response) => {
  const topPlans = await Order.aggregate([
    { $unwind: "$plans" },
    {
      $group: {
        _id: "$plans.plan",
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$plans.price" },
        title: { $first: "$plans.title" }
      }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 10 }
  ]);

  const userGrowth = await User.aggregate([
    { $match: { role: "buyer" } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 }
  ]);

  const statistics = {
    topPlans,
    userGrowth
  };

  res.status(200).json(apiResponse(true, "Sales statistics retrieved", statistics));
});

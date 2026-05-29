import { type Request, type Response } from "express";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { AdminActivityLog } from "../models/AdminActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

// Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role = "buyer", status, search, page = 1, limit = 10, sortBy = "createdAt" } = req.query;

  const filter: Record<string, unknown> = { role };

  if (status) filter.accountStatus = status;
  if (search) {
    filter.$or = [
      { fullName: { $regex: String(search), $options: "i" } },
      { email: { $regex: String(search), $options: "i" } },
      { country: { $regex: String(search), $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ [String(sortBy)]: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-password"),
    User.countDocuments(filter)
  ]);

  res.status(200).json(
    apiResponse(true, "Users retrieved", {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  );
});

// Get user details
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [user, purchaseHistory] = await Promise.all([
    User.findById(id).select("-password"),
    Order.find({ user: id })
      .populate("plans.plan", "title price")
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  if (!user) throw new AppError("User not found", 404);

  const userDetails = {
    ...user.toObject(),
    purchaseHistory,
    totalPurchases: purchaseHistory.length,
    totalSpent: purchaseHistory
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.totalAmount, 0)
  };

  res.status(200).json(apiResponse(true, "User details retrieved", userDetails));
});

// Suspend user account
export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);

  if (user.role === "admin") {
    throw new AppError("Cannot suspend admin accounts", 403);
  }

  user.accountStatus = "suspended";
  await user.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "user-suspended",
    targetModel: "User",
    targetId: user._id,
    description: `Suspended user account: ${user.email}${reason ? ` - Reason: ${reason}` : ""}`
  });

  res.status(200).json(apiResponse(true, "User account suspended", user));
});

// Activate user account
export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);

  user.accountStatus = "active";
  await user.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "user-activated",
    targetModel: "User",
    targetId: user._id,
    description: `Activated user account: ${user.email}`
  });

  res.status(200).json(apiResponse(true, "User account activated", user));
});

// Get user statistics
export const getUserStatistics = asyncHandler(async (req: Request, res: Response) => {
  const stats = await Promise.all([
    User.countDocuments({ role: "buyer", accountStatus: "active" }),
    User.countDocuments({ role: "buyer", accountStatus: "suspended" }),
    User.countDocuments({ role: "admin" }),
    User.aggregate([
      { $match: { role: "buyer" } },
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const [activeUsers, suspendedUsers, adminUsers, topCountries] = stats;

  res.status(200).json(
    apiResponse(true, "User statistics retrieved", {
      activeUsers,
      suspendedUsers,
      adminUsers,
      totalBuyers: activeUsers + suspendedUsers,
      topCountries
    })
  );
});

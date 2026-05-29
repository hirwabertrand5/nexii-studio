import { Router } from "express";
import {
  getAdminRevenueAnalytics,
  getAllTransactions
} from "../controllers/adminTransactionController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminTransactionRoutes = Router();

adminTransactionRoutes.use(requireAuth, requireAdmin);
adminTransactionRoutes.get("/analytics", asyncHandler(getAdminRevenueAnalytics));
adminTransactionRoutes.get("/", asyncHandler(getAllTransactions));

import { Router } from "express";
import {
  getAdminOrderAnalytics,
  getAllOrders,
  updateOrderStatus
} from "../controllers/adminOrderController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminOrderRoutes = Router();

adminOrderRoutes.use(requireAuth, requireAdmin);
adminOrderRoutes.get("/analytics", asyncHandler(getAdminOrderAnalytics));
adminOrderRoutes.get("/", asyncHandler(getAllOrders));
adminOrderRoutes.put("/:id", asyncHandler(updateOrderStatus));

import { Router } from "express";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  toggleDownloadAccess,
  getPaymentHistory
} from "../controllers/adminPaymentController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Admin payment routes - Protected
router.use(authenticate, adminMiddleware);

// Get all orders
router.get("/", getAllOrders);

// Get order details
router.get("/:id", getOrderById);

// Update order status
router.put("/:id/status", updateOrderStatus);

// Toggle download access
router.patch("/:id/download-access", toggleDownloadAccess);

// Get payment verification history
router.get("/:id/history", getPaymentHistory);

export { router as adminPaymentRoutes };

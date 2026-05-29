import { Router } from "express";
import {
  getDashboardOverview,
  getRecentActivity,
  getMonthlyRevenue,
  getSalesStatistics
} from "../controllers/adminDashboardController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Admin dashboard routes - Protected
router.use(authenticate, adminMiddleware);

// Overview
router.get("/overview", getDashboardOverview);

// Recent activity
router.get("/activity", getRecentActivity);

// Revenue
router.get("/revenue/monthly", getMonthlyRevenue);

// Statistics
router.get("/statistics", getSalesStatistics);

export { router as adminDashboardRoutes };

import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getUserStatistics
} from "../controllers/adminUserController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Admin user routes - Protected
router.use(authenticate, adminMiddleware);

// Get all users
router.get("/", getAllUsers);

// Get user statistics
router.get("/statistics/all", getUserStatistics);

// Get user by ID
router.get("/:id", getUserById);

// Suspend user
router.patch("/:id/suspend", suspendUser);

// Activate user
router.patch("/:id/activate", activateUser);

export { router as adminUserRoutes };

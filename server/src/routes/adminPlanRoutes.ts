import { Router } from "express";
import {
  getAllPlans,
  getPlanById,
  updatePlan,
  toggleFeaturedStatus,
  publishPlan,
  deletePlan,
  bulkDeletePlans,
  bulkPublishPlans
} from "../controllers/adminPlanController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Admin plan routes - Protected
router.use(authenticate, adminMiddleware);

// Get all plans
router.get("/", getAllPlans);

// Get plan by ID
router.get("/:id", getPlanById);

// Update plan
router.put("/:id", updatePlan);

// Toggle featured status
router.patch("/:id/featured", toggleFeaturedStatus);

// Publish plan
router.patch("/:id/publish", publishPlan);

// Delete plan
router.delete("/:id", deletePlan);

// Bulk operations
router.post("/bulk/delete", bulkDeletePlans);
router.post("/bulk/publish", bulkPublishPlans);

export { router as adminPlanRoutes };

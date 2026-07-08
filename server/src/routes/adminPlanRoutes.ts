import { Router } from "express";
import {
  createPlan,
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
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = Router();

// Admin plan routes - Protected
router.use(authenticate, adminMiddleware);

// Create plan
router.post(
  "/",
  uploadMiddleware.fields([
    { name: "images", maxCount: 5 },
    { name: "digitalFiles", maxCount: 3 }
  ]),
  createPlan
);

// Get all plans
router.get("/", getAllPlans);

// Get plan by ID
router.get("/:id", getPlanById);

// Update plan
router.put(
  "/:id",
  uploadMiddleware.fields([
    { name: "images", maxCount: 5 },
    { name: "digitalFiles", maxCount: 3 }
  ]),
  updatePlan
);

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

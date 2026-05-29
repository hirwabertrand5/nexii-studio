import { Router } from "express";
import {
  createHousePlan,
  deleteHousePlan,
  getAdminPlans,
  getPlan,
  getPlans,
  updateHousePlan
} from "../controllers/planController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const planRoutes = Router();

planRoutes.get("/", asyncHandler(getPlans));
planRoutes.get("/admin", requireAuth, requireAdmin, asyncHandler(getAdminPlans));
planRoutes.get("/:id", asyncHandler(getPlan));
planRoutes.post("/", requireAuth, requireAdmin, asyncHandler(createHousePlan));
planRoutes.put("/:id", requireAuth, requireAdmin, asyncHandler(updateHousePlan));
planRoutes.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteHousePlan));

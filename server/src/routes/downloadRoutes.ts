import { Router } from "express";
import { downloadPlan, streamPlanFile } from "../controllers/downloadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const downloadRoutes = Router();

downloadRoutes.get("/:planId/files/:fileName", requireAuth, asyncHandler(streamPlanFile));
downloadRoutes.get("/:planId", requireAuth, asyncHandler(downloadPlan));

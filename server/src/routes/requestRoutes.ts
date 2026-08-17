import { Router } from "express";
import {
  createCustomRequest,
  getMyRequests,
  getRequestDetails,
  uploadRequestFiles,
  respondToQuotation,
  addMessageToRequest,
  getRequestTimeline
} from "../controllers/customRequestController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = Router();

// Public create route, protected client access for account-linked actions
router.post("/", createCustomRequest);
router.get("/mine", requireAuth, getMyRequests);
router.get("/:id", requireAuth, getRequestDetails);
router.post("/:id/files", requireAuth, uploadMiddleware.array("files", 12), uploadRequestFiles);
router.post("/:id/quotation/respond", requireAuth, respondToQuotation);
router.post("/:id/messages", requireAuth, addMessageToRequest);
router.get("/:id/timeline", requireAuth, getRequestTimeline);

export { router as requestRoutes };

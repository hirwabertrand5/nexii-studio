import { Router } from "express";
import {
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  sendQuotation,
  addNotes,
  getRequestStatistics
} from "../controllers/adminCustomRequestController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Admin custom request routes - Protected
router.use(authenticate, adminMiddleware);

// Get all requests
router.get("/", getAllRequests);

// Get request statistics
router.get("/statistics/all", getRequestStatistics);

// Get request by ID
router.get("/:id", getRequestById);

// Update request status
router.put("/:id/status", updateRequestStatus);

// Send quotation
router.post("/:id/quotation", sendQuotation);

// Add notes
router.put("/:id/notes", addNotes);

export { router as adminCustomRequestRoutes };

import { Router } from "express";
import { createUploadSignature } from "../controllers/uploadController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = Router();

router.post("/signature", authenticate, adminMiddleware, createUploadSignature);

export { router as uploadRoutes };

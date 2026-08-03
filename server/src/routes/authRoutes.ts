import { Router } from "express";
import {
	me,
	adminLogin,
	updateMe,
	logout,
	refreshTokenHandler,
} from "../controllers/authController.js";
import { googleLogin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimitMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRoutes = Router();

authRoutes.post("/refresh", asyncHandler(refreshTokenHandler));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.post("/admin-login", loginLimiter, asyncHandler(adminLogin));
authRoutes.patch("/me", requireAuth, asyncHandler(updateMe));
authRoutes.post("/logout", requireAuth, asyncHandler(logout));
authRoutes.post("/google-login", loginLimiter, asyncHandler(googleLogin));
authRoutes.post("/admin/login", loginLimiter, asyncHandler(adminLogin));

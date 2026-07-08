import { Router } from "express";
import {
	registerChallenge,
	registerVerify,
	loginChallenge,
	loginVerify,
	me,
	adminLogin,
	updateMe,
	logout,
	refreshTokenHandler,
	forgotPassword
} from "../controllers/authController.js";
import { googleLogin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimitMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRoutes = Router();

authRoutes.post("/register-challenge", loginLimiter, asyncHandler(registerChallenge));
authRoutes.post("/register-verify", loginLimiter, asyncHandler(registerVerify));
authRoutes.post("/login-challenge", loginLimiter, asyncHandler(loginChallenge));
authRoutes.post("/login-verify", loginLimiter, asyncHandler(loginVerify));
authRoutes.post("/refresh", asyncHandler(refreshTokenHandler));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.post("/admin-login", loginLimiter, asyncHandler(adminLogin));
authRoutes.patch("/me", requireAuth, asyncHandler(updateMe));
authRoutes.post("/logout", requireAuth, asyncHandler(logout));
authRoutes.post("/forgot-password", loginLimiter, asyncHandler(forgotPassword));
authRoutes.post("/google-login", asyncHandler(googleLogin));
authRoutes.post("/admin/login", loginLimiter, asyncHandler(adminLogin));

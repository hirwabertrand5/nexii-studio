import { Router } from "express";
import {
	registerChallenge,
	registerVerify,
	loginChallenge,
	loginVerify,
	me,
	logout,
	refreshTokenHandler,
	forgotPassword
} from "../controllers/authController.js";
import { googleLogin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRoutes = Router();

authRoutes.post("/register-challenge", asyncHandler(registerChallenge));
authRoutes.post("/register-verify", asyncHandler(registerVerify));
authRoutes.post("/login-challenge", asyncHandler(loginChallenge));
authRoutes.post("/login-verify", asyncHandler(loginVerify));
authRoutes.post("/refresh", asyncHandler(refreshTokenHandler));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.post("/logout", requireAuth, asyncHandler(logout));
authRoutes.post("/forgot-password", asyncHandler(forgotPassword));
authRoutes.post("/google-login", asyncHandler(googleLogin));

import { Router } from "express";
import { forgotPassword, login, logout, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(register));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.post("/logout", requireAuth, asyncHandler(logout));
authRoutes.post("/forgot-password", asyncHandler(forgotPassword));

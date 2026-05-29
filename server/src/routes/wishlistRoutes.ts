import { Router } from "express";
import {
  addWishlistPlan,
  getMyWishlist,
  removeWishlistPlan
} from "../controllers/wishlistController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireBuyer } from "../middleware/buyerMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const wishlistRoutes = Router();

wishlistRoutes.use(requireAuth, requireBuyer);
wishlistRoutes.get("/", asyncHandler(getMyWishlist));
wishlistRoutes.post("/:planId", asyncHandler(addWishlistPlan));
wishlistRoutes.delete("/:planId", asyncHandler(removeWishlistPlan));

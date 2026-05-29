import { Router } from "express";
import { createCheckout, getMyOrders, getSingleOrder } from "../controllers/orderController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireBuyer } from "../middleware/buyerMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const orderRoutes = Router();

orderRoutes.post("/checkout", requireAuth, requireBuyer, asyncHandler(createCheckout));
orderRoutes.get("/my-orders", requireAuth, requireBuyer, asyncHandler(getMyOrders));
orderRoutes.get("/:id", requireAuth, asyncHandler(getSingleOrder));

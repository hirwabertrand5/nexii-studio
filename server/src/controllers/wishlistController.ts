import type { Request, Response } from "express";
import { addPlanToWishlist, getWishlist, removePlanFromWishlist } from "../services/wishlistService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { assertValidObjectId } from "../utils/validators.js";

function routeParam(value: string | string[] | undefined, label: string) {
  if (typeof value !== "string") {
    throw new Error(`${label} is required`);
  }
  return value;
}

export async function getMyWishlist(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const wishlist = await getWishlist(userId);
  return sendSuccess(res, { wishlist });
}

export async function addWishlistPlan(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const planId = routeParam(req.params.planId, "plan id");
  assertValidObjectId(planId, "plan id");
  const wishlist = await addPlanToWishlist(userId, planId);
  return sendSuccess(res, { wishlist }, 201);
}

export async function removeWishlistPlan(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const planId = routeParam(req.params.planId, "plan id");
  assertValidObjectId(planId, "plan id");
  const wishlist = await removePlanFromWishlist(userId, planId);
  return sendSuccess(res, { wishlist });
}

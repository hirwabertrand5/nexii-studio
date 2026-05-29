import { HousePlan } from "../models/HousePlan.js";
import { Wishlist } from "../models/Wishlist.js";
import { AppError } from "../utils/AppError.js";
import { toObjectId } from "./planService.js";

export async function getWishlist(userId: string) {
  const wishlist = await Wishlist.findOne({ user: userId })
    .populate({
      path: "plans",
      match: { status: "published" },
      select: "-__v"
    })
    .lean();

  return wishlist ?? { user: userId, plans: [] };
}

export async function addPlanToWishlist(userId: string, planId: string) {
  const plan = await HousePlan.findOne({ _id: planId, status: "published" }).select("_id");
  if (!plan) throw new AppError("Published house plan not found", 404);

  await Wishlist.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: { user: toObjectId(userId) },
      $addToSet: { plans: toObjectId(planId) }
    },
    { upsert: true, new: true }
  );

  return getWishlist(userId);
}

export async function removePlanFromWishlist(userId: string, planId: string) {
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { plans: toObjectId(planId) } },
    { new: true }
  );

  return getWishlist(userId);
}

import { type Request, type Response } from "express";
import { HousePlan } from "../models/HousePlan.js";
import { AdminActivityLog } from "../models/AdminActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

// Get all plans with filters
export const getAllPlans = asyncHandler(async (req: Request, res: Response) => {
  const { category, status, search, page = 1, limit = 10, sortBy = "createdAt" } = req.query;

  const filter: Record<string, unknown> = {};

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) {
    filter.$text = { $search: String(search) };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [plans, total] = await Promise.all([
    HousePlan.find(filter)
      .sort({ [String(sortBy)]: -1 })
      .skip(skip)
      .limit(Number(limit)),
    HousePlan.countDocuments(filter)
  ]);

  res.status(200).json(
    apiResponse(true, "Plans retrieved", {
      plans,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  );
});

// Get single plan
export const getPlanById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const plan = await HousePlan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);

  res.status(200).json(apiResponse(true, "Plan retrieved", plan));
});

// Update plan
export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const plan = await HousePlan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);

  const oldPlan = { ...plan.toObject() };

  Object.assign(plan, updates);
  await plan.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-updated",
    targetModel: "HousePlan",
    targetId: plan._id,
    description: `Updated plan: ${plan.title}`,
    changes: {
      title: { before: oldPlan.title, after: plan.title },
      price: { before: oldPlan.price, after: plan.price },
      status: { before: oldPlan.status, after: plan.status }
    }
  });

  res.status(200).json(apiResponse(true, "Plan updated successfully", plan));
});

// Toggle featured status
export const toggleFeaturedStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const plan = await HousePlan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);

  plan.isFeatured = !plan.isFeatured;
  await plan.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-featured",
    targetModel: "HousePlan",
    targetId: plan._id,
    description: `${plan.isFeatured ? "Featured" : "Unfeatured"} plan: ${plan.title}`
  });

  res.status(200).json(apiResponse(true, "Plan featured status updated", plan));
});

// Publish plan
export const publishPlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const plan = await HousePlan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);

  plan.status = "published";
  await plan.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-published",
    targetModel: "HousePlan",
    targetId: plan._id,
    description: `Published plan: ${plan.title}`
  });

  res.status(200).json(apiResponse(true, "Plan published successfully", plan));
});

// Delete plan
export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const plan = await HousePlan.findByIdAndDelete(id);
  if (!plan) throw new AppError("Plan not found", 404);

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-deleted",
    targetModel: "HousePlan",
    targetId: plan._id,
    description: `Deleted plan: ${plan.title}`
  });

  res.status(200).json(apiResponse(true, "Plan deleted successfully", { id }));
});

// Bulk delete plans
export const bulkDeletePlans = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError("Please provide an array of plan IDs", 400);
  }

  const result = await HousePlan.deleteMany({ _id: { $in: ids } });

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-deleted",
    targetModel: "HousePlan",
    description: `Bulk deleted ${result.deletedCount} plans`
  });

  res.status(200).json(
    apiResponse(true, `${result.deletedCount} plans deleted successfully`, {
      deletedCount: result.deletedCount
    })
  );
});

// Bulk publish plans
export const bulkPublishPlans = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError("Please provide an array of plan IDs", 400);
  }

  const result = await HousePlan.updateMany(
    { _id: { $in: ids } },
    { status: "published" }
  );

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-published",
    targetModel: "HousePlan",
    description: `Bulk published ${result.modifiedCount} plans`
  });

  res.status(200).json(
    apiResponse(true, `${result.modifiedCount} plans published successfully`, {
      modifiedCount: result.modifiedCount
    })
  );
});

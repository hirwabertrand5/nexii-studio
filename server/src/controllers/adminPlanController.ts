import { type Request, type Response } from "express";
import { type Types } from "mongoose";
import fs from "fs/promises";
import path from "path";
import { HousePlan, PLAN_STATUSES, type PlanStatus } from "../models/HousePlan.js";
import { AdminActivityLog } from "../models/AdminActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type UploadedDigitalFile = {
  label: string;
  fileName: string;
  storageKey: string;
  contentType?: string;
  sizeInBytes?: number;
};

const publicUploadRoot = path.resolve(process.cwd(), "..", "uploads");
const privateUploadRoot = path.resolve(process.cwd(), "private-uploads");
const PRIVATE_FILE_LABELS = [
  "Architectural Plans",
  "Digital Drawings",
  "Printable Delivery Package"
] as const;

function getPublicBaseUrl() {
  return (
    process.env.PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    `http://localhost:${process.env.PORT || 5000}`
  ).replace(/\/$/, "");
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeCategory(value: unknown) {
  const raw = pickString(value);
  if (!raw) {
    throw new AppError("category is required", 400);
  }

  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseNumberField(value: unknown, field: string, { required = true, min = 0 }: { required?: boolean; min?: number } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`${field} is required`, 400);
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(`${field} must be a valid number`, 400);
  }

  if (typeof min === "number" && parsed < min) {
    throw new AppError(`${field} must be greater than or equal to ${min}`, 400);
  }

  return parsed;
}

function parseStringArrayField(value: unknown, field: string, { required = false }: { required?: boolean } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`${field} is required`, 400);
    return undefined;
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : null;

  if (!rawValues) {
    throw new AppError(`${field} must be an array or comma-separated string`, 400);
  }

  const parsed = rawValues.map((item) => String(item).trim()).filter(Boolean);
  if (required && parsed.length === 0) {
    throw new AppError(`${field} is required`, 400);
  }

  return parsed;
}

function parseCategoryField(value: unknown) {
  return normalizeCategory(value);
}

function parseStatusField(value: unknown, fieldName = "status") {
  const status = pickString(value)?.toLowerCase();
  if (!status) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (!PLAN_STATUSES.includes(status as PlanStatus)) {
    throw new AppError(`Invalid ${fieldName}. Must be one of: ${PLAN_STATUSES.join(", ")}`, 400);
  }

  return status as PlanStatus;
}

function parseBooleanField(value: unknown, fieldName: string, { required = false }: { required?: boolean } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`${fieldName} is required`, 400);
    return undefined;
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  throw new AppError(`${fieldName} must be true or false`, 400);
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function getUploadedFieldFiles(req: Request, fieldName: string) {
  const rawFiles = (req as any).files;
  if (!rawFiles) return [] as UploadFile[];

  if (Array.isArray(rawFiles)) {
    return fieldName === "images" ? (rawFiles as UploadFile[]) : [];
  }

  const fieldFiles = rawFiles?.[fieldName];
  return Array.isArray(fieldFiles) ? (fieldFiles as UploadFile[]) : [];
}

function parseDigitalFileLabels(value: unknown) {
  if (value === undefined || value === null || value === "") return [] as string[];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [String(value).trim()].filter(Boolean);
  }

  const trimmed = value.trim();
  if (!trimmed) return [] as string[];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma-separated parsing
    }
  }

  return trimmed
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadPlanImages(files: UploadFile[]) {
  if (!files.length) return [] as string[];
  if (files.length > 5) {
    throw new AppError("You can upload a maximum of 5 images", 400);
  }

  const urls: string[] = [];
  for (const file of files) {
    if (!file.mimetype?.startsWith("image/")) {
      throw new AppError("Plan images must be image files", 400);
    }

    const safeName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
    const relativePath = path.posix.join("requests", safeName);
    const absolutePath = path.join(publicUploadRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);
    urls.push(`${getPublicBaseUrl()}/uploads/${relativePath.replace(/\\/g, "/")}`);
  }

  return urls;
}

async function uploadPrivateDigitalFiles(files: UploadFile[], labels: string[]): Promise<UploadedDigitalFile[]> {
  if (!files.length) return [];
  if (files.length > PRIVATE_FILE_LABELS.length) {
    throw new AppError(`You can upload a maximum of ${PRIVATE_FILE_LABELS.length} private files`, 400);
  }

  const uploadsDir = path.join(privateUploadRoot, "plan-files");
  await fs.mkdir(uploadsDir, { recursive: true });

  const results: UploadedDigitalFile[] = [];
  for (const [index, file] of files.entries()) {
    const label = (labels[index] ?? PRIVATE_FILE_LABELS[index] ?? `Private File ${index + 1}`).trim();
    const safeName = `${Date.now()}-${index + 1}-${sanitizeFileName(file.originalname)}`;
    const storageKey = `private://plan-files/${safeName}`;
    await fs.writeFile(path.join(uploadsDir, safeName), file.buffer);

    results.push({
      label,
      fileName: file.originalname,
      storageKey,
      contentType: file.mimetype,
      sizeInBytes: file.size
    });
  }

  return results;
}

async function buildCreatePayload(
  body: Record<string, unknown>,
  adminId: Types.ObjectId,
  imageFiles: UploadFile[],
  digitalUploadFiles: UploadFile[]
) {
  const title = pickString(body.title, body.name);
  const description = pickString(body.description);
  const architecturalStyle = pickString(body.architecturalStyle, body.style);

  if (!title) throw new AppError("title is required", 400);
  if (!description) throw new AppError("description is required", 400);
  if (!architecturalStyle) throw new AppError("architecturalStyle is required", 400);

  const uploadedImages = await uploadPlanImages(imageFiles);
  const images = uploadedImages.length > 0
    ? uploadedImages
    : parseStringArrayField(body.images ?? body.imageUrls ?? body.imageUrl, "images", { required: true }) ?? [];

  if (images.length === 0) {
    throw new AppError("At least one image is required", 400);
  }

  const previewImages = parseStringArrayField(body.previewImages ?? body.previewImageUrls, "previewImages") ?? images.slice(0, 3);
  const filesIncluded = parseStringArrayField(body.filesIncluded, "filesIncluded") ?? [];
  const digitalFiles = await uploadPrivateDigitalFiles(
    digitalUploadFiles,
    parseDigitalFileLabels(body.digitalFilesLabels)
  );

  const status =
    body.status !== undefined && body.status !== null && String(body.status).trim() !== ""
      ? parseStatusField(body.status)
      : ("published" as PlanStatus);

  return {
    title,
    description,
    price: parseNumberField(body.price, "price") as number,
    bedrooms: parseNumberField(body.bedrooms, "bedrooms") as number,
    bathrooms: parseNumberField(body.bathrooms, "bathrooms") as number,
    floors: parseNumberField(body.floors, "floors") as number,
    plotSize: parseNumberField(body.plotSize, "plotSize") as number,
    totalArea: parseNumberField(body.totalArea ?? body.area, "totalArea") as number,
    architecturalStyle,
    category: parseCategoryField(body.category),
    images,
    previewImages,
    filesIncluded,
    digitalFiles,
    isFeatured: parseBooleanField(body.isFeatured, "isFeatured") ?? false,
    status,
    createdBy: adminId
  };
}

async function buildUpdatePayload(body: Record<string, unknown>, imageFiles: UploadFile[], digitalUploadFiles: UploadFile[]) {
  const updates: Record<string, unknown> = {};

  const title = pickString(body.title, body.name);
  if (title !== undefined) updates.title = title;

  const description = pickString(body.description);
  if (description !== undefined) updates.description = description;

  const architecturalStyle = pickString(body.architecturalStyle, body.style);
  if (architecturalStyle !== undefined) updates.architecturalStyle = architecturalStyle;

  if (body.price !== undefined) updates.price = parseNumberField(body.price, "price", { required: false });
  if (body.bedrooms !== undefined) updates.bedrooms = parseNumberField(body.bedrooms, "bedrooms", { required: false });
  if (body.bathrooms !== undefined) updates.bathrooms = parseNumberField(body.bathrooms, "bathrooms", { required: false });
  if (body.floors !== undefined) updates.floors = parseNumberField(body.floors, "floors", { required: false });
  if (body.plotSize !== undefined) updates.plotSize = parseNumberField(body.plotSize, "plotSize", { required: false });
  if (body.totalArea !== undefined || body.area !== undefined) {
    updates.totalArea = parseNumberField(body.totalArea ?? body.area, "totalArea", { required: false });
  }

  if (body.category !== undefined) {
    updates.category = parseCategoryField(body.category);
  }

  const uploadedImages = await uploadPlanImages(imageFiles);
  if (uploadedImages.length > 0) {
    updates.images = uploadedImages;
    updates.previewImages = parseStringArrayField(body.previewImages ?? body.previewImageUrls, "previewImages") ?? uploadedImages.slice(0, 3);
  } else if (body.images !== undefined || body.imageUrls !== undefined || body.imageUrl !== undefined) {
    const parsedImages = parseStringArrayField(body.images ?? body.imageUrls ?? body.imageUrl, "images", { required: true });
    if (parsedImages) {
      updates.images = parsedImages;
    }
  }

  if (body.previewImages !== undefined || body.previewImageUrls !== undefined) {
    updates.previewImages = parseStringArrayField(body.previewImages ?? body.previewImageUrls, "previewImages");
  }

  if (body.filesIncluded !== undefined) {
    updates.filesIncluded = parseStringArrayField(body.filesIncluded, "filesIncluded");
  }

  const uploadedDigitalFiles = await uploadPrivateDigitalFiles(
    digitalUploadFiles,
    parseDigitalFileLabels(body.digitalFilesLabels)
  );
  if (uploadedDigitalFiles.length > 0) {
    updates.digitalFiles = uploadedDigitalFiles;
  }

  if (body.isFeatured !== undefined) {
    updates.isFeatured = parseBooleanField(body.isFeatured, "isFeatured");
  }

  if (body.status !== undefined) {
    updates.status = parseStatusField(body.status);
  }

  return updates;
}

// Create a new plan
export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).admin?._id as Types.ObjectId;
  if (!adminId) {
    throw new AppError("Unauthorized", 401);
  }

  const payload = await buildCreatePayload(
    (req.body ?? {}) as Record<string, unknown>,
    adminId,
    getUploadedFieldFiles(req, "images"),
    getUploadedFieldFiles(req, "digitalFiles")
  );
  const plan = await HousePlan.create(payload);

  await AdminActivityLog.create({
    admin: adminId,
    action: "plan-created",
    targetModel: "HousePlan",
    targetId: plan._id,
    description: `Created plan: ${plan.title}`
  });

  res.status(201).json(apiResponse(true, "Plan created successfully", plan));
});

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

  const plan = await HousePlan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);

  const oldPlan = plan.toObject();
  const previousPlan = oldPlan as unknown as Record<string, unknown>;
  const updates = await buildUpdatePayload(
    (req.body ?? {}) as Record<string, unknown>,
    getUploadedFieldFiles(req, "images"),
    getUploadedFieldFiles(req, "digitalFiles")
  );

  Object.assign(plan, updates);
  await plan.save();

  const trackedFields = ["title", "price", "status", "isFeatured", "category", "images"] as const;
  const nextPlan = plan.toObject() as unknown as Record<string, unknown>;
  const changes = trackedFields.reduce<Record<string, { before: unknown; after: unknown }>>((acc, field) => {
    if (field in updates) {
      acc[field] = {
        before: previousPlan[field],
        after: nextPlan[field]
      };
    }
    return acc;
  }, {});

  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "plan-updated",
    targetModel: "HousePlan",
    targetId: plan._id,
    description: `Updated plan: ${plan.title}`,
    changes: Object.keys(changes).length > 0 ? changes : undefined
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

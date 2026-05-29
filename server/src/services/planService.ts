import mongoose, { type SortOrder, type Types } from "mongoose";
import {
  HousePlan,
  PLAN_CATEGORIES,
  PLAN_STATUSES,
  type HousePlanAttrs,
  type PlanCategory,
  type PlanStatus
} from "../models/HousePlan.js";
import { AppError } from "../utils/AppError.js";
import {
  enumValue,
  escapeRegex,
  optionalEnumValue,
  optionalString,
  requiredString,
  stringArray,
  toOptionalNumber,
  toPositiveInteger,
  toPositiveNumber
} from "../utils/validators.js";

export type CreatePlanInput = Omit<HousePlanAttrs, "createdBy">;
export type UpdatePlanInput = Partial<CreatePlanInput>;

type PlanListQuery = {
  page?: unknown;
  limit?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  floors?: unknown;
  minPrice?: unknown;
  maxPrice?: unknown;
  plotSize?: unknown;
  minPlotSize?: unknown;
  maxPlotSize?: unknown;
  category?: unknown;
  architecturalStyle?: unknown;
  style?: unknown;
  search?: unknown;
  sort?: unknown;
  status?: unknown;
  featured?: unknown;
};

type PlanFilter = Record<string, any>;

const PUBLIC_PLAN_FILTER: PlanFilter = { status: "published" };
const MAX_LIMIT = 50;

function buildSort(sort: unknown): Record<string, SortOrder> {
  switch (sort) {
    case "price-low-high":
      return { price: 1, createdAt: -1 };
    case "price-high-low":
      return { price: -1, createdAt: -1 };
    case "latest":
    default:
      return { createdAt: -1 };
  }
}

function booleanQuery(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new AppError("featured must be true or false", 400);
}

function parseDigitalFiles(value: unknown, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new AppError("digitalFiles is required", 400);
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError("digitalFiles must be an array", 400);
  }

  return value.map((item) => {
    const file = (item ?? {}) as Record<string, unknown>;
    const parsed: {
      label: string;
      fileName: string;
      storageKey: string;
      contentType?: string;
      sizeInBytes?: number;
    } = {
      label: requiredString(file.label, "digitalFiles.label"),
      fileName: requiredString(file.fileName, "digitalFiles.fileName"),
      storageKey: requiredString(file.storageKey, "digitalFiles.storageKey")
    };

    const contentType = optionalString(file.contentType);
    const sizeInBytes = toOptionalNumber(file.sizeInBytes, "digitalFiles.sizeInBytes");
    if (contentType) parsed.contentType = contentType;
    if (sizeInBytes !== undefined) parsed.sizeInBytes = sizeInBytes;

    return parsed;
  });
}

export function parseCreatePlanInput(body: unknown): CreatePlanInput {
  const input = (body ?? {}) as Record<string, unknown>;

  return {
    title: requiredString(input.title, "title"),
    description: requiredString(input.description, "description"),
    price: toPositiveNumber(input.price, "price"),
    bedrooms: toPositiveInteger(input.bedrooms, "bedrooms"),
    bathrooms: toPositiveInteger(input.bathrooms, "bathrooms"),
    floors: toPositiveInteger(input.floors, "floors"),
    plotSize: toPositiveNumber(input.plotSize, "plotSize"),
    totalArea: toPositiveNumber(input.totalArea, "totalArea"),
    architecturalStyle: requiredString(input.architecturalStyle, "architecturalStyle").toLowerCase(),
    category: enumValue(input.category, PLAN_CATEGORIES, "category"),
    images: stringArray(input.images, "images", true),
    previewImages: stringArray(input.previewImages, "previewImages"),
    filesIncluded: stringArray(input.filesIncluded, "filesIncluded"),
    digitalFiles: parseDigitalFiles(input.digitalFiles),
    isFeatured: Boolean(input.isFeatured),
    status: input.status ? enumValue(input.status, PLAN_STATUSES, "status") : "draft"
  };
}

export function parseUpdatePlanInput(body: unknown): UpdatePlanInput {
  const input = (body ?? {}) as Record<string, unknown>;
  const update: UpdatePlanInput = {};

  if ("title" in input) update.title = requiredString(input.title, "title");
  if ("description" in input) update.description = requiredString(input.description, "description");
  if ("price" in input) update.price = toPositiveNumber(input.price, "price");
  if ("bedrooms" in input) update.bedrooms = toPositiveInteger(input.bedrooms, "bedrooms");
  if ("bathrooms" in input) update.bathrooms = toPositiveInteger(input.bathrooms, "bathrooms");
  if ("floors" in input) update.floors = toPositiveInteger(input.floors, "floors");
  if ("plotSize" in input) update.plotSize = toPositiveNumber(input.plotSize, "plotSize");
  if ("totalArea" in input) update.totalArea = toPositiveNumber(input.totalArea, "totalArea");
  if ("architecturalStyle" in input) {
    update.architecturalStyle = requiredString(input.architecturalStyle, "architecturalStyle").toLowerCase();
  }
  if ("category" in input) update.category = enumValue(input.category, PLAN_CATEGORIES, "category");
  if ("images" in input) update.images = stringArray(input.images, "images", true);
  if ("previewImages" in input) update.previewImages = stringArray(input.previewImages, "previewImages");
  if ("filesIncluded" in input) update.filesIncluded = stringArray(input.filesIncluded, "filesIncluded");
  if ("digitalFiles" in input) update.digitalFiles = parseDigitalFiles(input.digitalFiles, true);
  if ("isFeatured" in input) update.isFeatured = Boolean(input.isFeatured);
  if ("status" in input) update.status = enumValue(input.status, PLAN_STATUSES, "status");

  if (Object.keys(update).length === 0) {
    throw new AppError("At least one valid field is required", 400);
  }

  return update;
}

export async function listPlans(query: PlanListQuery, includeDrafts = false) {
  const page = Math.max(1, Math.trunc(toOptionalNumber(query.page, "page") ?? 1));
  const requestedLimit = Math.max(1, Math.trunc(toOptionalNumber(query.limit, "limit") ?? 12));
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filter: PlanFilter = includeDrafts ? {} : { ...PUBLIC_PLAN_FILTER };

  const status = optionalEnumValue(query.status, PLAN_STATUSES, "status");
  if (includeDrafts && status) filter.status = status;

  const featured = booleanQuery(query.featured);
  if (featured !== undefined) filter.isFeatured = featured;

  const bedrooms = toOptionalNumber(query.bedrooms, "bedrooms");
  const bathrooms = toOptionalNumber(query.bathrooms, "bathrooms");
  const floors = toOptionalNumber(query.floors, "floors");
  if (bedrooms !== undefined) filter.bedrooms = bedrooms;
  if (bathrooms !== undefined) filter.bathrooms = bathrooms;
  if (floors !== undefined) filter.floors = floors;

  const minPrice = toOptionalNumber(query.minPrice, "minPrice");
  const maxPrice = toOptionalNumber(query.maxPrice, "maxPrice");
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const exactPlotSize = toOptionalNumber(query.plotSize, "plotSize");
  const minPlotSize = toOptionalNumber(query.minPlotSize, "minPlotSize");
  const maxPlotSize = toOptionalNumber(query.maxPlotSize, "maxPlotSize");
  if (exactPlotSize !== undefined) {
    filter.plotSize = exactPlotSize;
  } else if (minPlotSize !== undefined || maxPlotSize !== undefined) {
    filter.plotSize = {};
    if (minPlotSize !== undefined) filter.plotSize.$gte = minPlotSize;
    if (maxPlotSize !== undefined) filter.plotSize.$lte = maxPlotSize;
  }

  const category = optionalEnumValue(query.category, PLAN_CATEGORIES, "category");
  if (category) filter.category = category;

  const style = optionalString(query.architecturalStyle) ?? optionalString(query.style);
  if (style) filter.architecturalStyle = style.toLowerCase();

  const search = optionalString(query.search);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { title: regex },
      { category: regex },
      { architecturalStyle: regex }
    ];
  }

  const [plans, total] = await Promise.all([
    HousePlan.find(filter)
      .sort(buildSort(query.sort))
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "fullName email")
      .lean(),
    HousePlan.countDocuments(filter)
  ]);

  return {
    plans,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getPlanWithRelated(id: string, includeDrafts = false) {
  const filter: PlanFilter = { _id: id };
  if (!includeDrafts) filter.status = "published";

  const plan = await HousePlan.findOne(filter).populate("createdBy", "fullName email").lean();
  if (!plan) throw new AppError("House plan not found", 404);

  const relatedPlans = await HousePlan.find({
    _id: { $ne: plan._id },
    category: plan.category,
    status: "published"
  })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(4)
    .lean();

  return { plan, relatedPlans };
}

export async function createPlan(input: CreatePlanInput, createdBy: Types.ObjectId) {
  return HousePlan.create({ ...input, createdBy });
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const updated = await HousePlan.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true
  });

  if (!updated) throw new AppError("House plan not found", 404);
  return updated;
}

export async function deletePlan(id: string) {
  const deleted = await HousePlan.findByIdAndDelete(id);
  if (!deleted) throw new AppError("House plan not found", 404);
  return deleted;
}

export function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

export type { PlanCategory, PlanStatus };

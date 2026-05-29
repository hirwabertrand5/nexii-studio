import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";

export const PLAN_CATEGORIES = [
  "bungalow",
  "duplex",
  "modern-villa",
  "small-plot-home",
  "african-contemporary"
] as const;

export const PLAN_STATUSES = ["draft", "published"] as const;

export type PlanCategory = (typeof PLAN_CATEGORIES)[number];
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export interface HousePlanAttrs {
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  plotSize: number;
  totalArea: number;
  architecturalStyle: string;
  category: PlanCategory;
  images: string[];
  previewImages: string[];
  filesIncluded: string[];
  digitalFiles: {
    label: string;
    fileName: string;
    storageKey: string;
    contentType?: string;
    sizeInBytes?: number;
  }[];
  isFeatured: boolean;
  status: PlanStatus;
  createdBy: Types.ObjectId;
}

export type HousePlanDoc = HydratedDocument<HousePlanAttrs>;

const housePlanSchema = new Schema<HousePlanAttrs>(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    floors: { type: Number, required: true, min: 0 },
    plotSize: { type: Number, required: true, min: 0 },
    totalArea: { type: Number, required: true, min: 0 },
    architecturalStyle: { type: String, required: true, trim: true, lowercase: true, index: true },
    category: { type: String, required: true, enum: PLAN_CATEGORIES, index: true },
    images: [{ type: String, required: true, trim: true }],
    previewImages: [{ type: String, trim: true }],
    filesIncluded: [{ type: String, trim: true }],
    digitalFiles: [
      {
        label: { type: String, required: true, trim: true },
        fileName: { type: String, required: true, trim: true },
        storageKey: { type: String, required: true, trim: true, select: false },
        contentType: { type: String, trim: true },
        sizeInBytes: { type: Number, min: 0 }
      }
    ],
    isFeatured: { type: Boolean, default: false, index: true },
    status: { type: String, required: true, enum: PLAN_STATUSES, default: "draft", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

housePlanSchema.index({
  title: "text",
  category: "text",
  architecturalStyle: "text"
});
housePlanSchema.index({ status: 1, category: 1, price: 1 });
housePlanSchema.index({ status: 1, bedrooms: 1, bathrooms: 1, floors: 1 });
housePlanSchema.index({ status: 1, createdAt: -1 });

export const HousePlan = mongoose.model<HousePlanAttrs>("HousePlan", housePlanSchema);

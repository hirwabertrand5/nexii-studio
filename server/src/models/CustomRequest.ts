import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";

export const REQUEST_STATUSES = [
  "pending",
  "under-review",
  "clarification-needed",
  "quotation-sent",
  "approved",
  "rejected",
  "in-progress",
  "completed"
] as const;

export const PROJECT_TYPES = [
  "residential",
  "villa",
  "apartment",
  "commercial",
  "mixed-use"
] as const;

export const QUOTATION_STATUSES = ["pending", "accepted", "rejected", "revision-requested"] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export interface ProjectFile {
  fileName: string;
  storageKey: string;
  contentType?: string;
  sizeInBytes?: number;
  fileType: "sketch" | "document" | "inspiration" | "other";
  uploadedAt: Date;
}

export interface QuotationDetail {
  amount: number;
  currency: string;
  description: string;
  pricingBreakdown?: Array<{
    item: string;
    amount: number;
  }>;
  estimatedTimeline: string;
  notes: string;
  status: QuotationStatus;
  sentAt: Date;
  responseDeadline?: Date;
  clientResponse?: {
    status: QuotationStatus;
    message: string;
    respondedAt: Date;
  };
}

export interface TimelineEntry {
  stage: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  estimatedDuration: string;
  completedAt?: Date;
  notes?: string;
}

export interface CustomRequestAttrs {
  user: Types.ObjectId;
  projectTitle: string;
  projectType: ProjectType;
  plotSize: number; // in square meters
  bedrooms: number;
  bathrooms: number;
  floors: number;
  budget: number;
  budgetCurrency: string;
  country: string;
  location: string;
  architecturalStyle: string;
  description: string;
  functionalRequirements?: string[];
  inspirationPreferences?: string[];
  uploadedFiles: ProjectFile[];
  status: RequestStatus;
  quotation?: QuotationDetail;
  assignedArchitect?: Types.ObjectId;
  timeline: TimelineEntry[];
  adminNotes: string;
  clientMessages: Array<{
    senderType: "client" | "admin";
    message: string;
    createdAt: Date;
  }>;
  completedAt?: Date;
}

export type CustomRequestDoc = HydratedDocument<CustomRequestAttrs>;

const projectFileSchema = new Schema<ProjectFile>(
  {
    fileName: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true, trim: true, select: false },
    contentType: { type: String, trim: true },
    sizeInBytes: { type: Number, min: 0 },
    fileType: { type: String, required: true, enum: ["sketch", "document", "inspiration", "other"] },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const quotationDetailSchema = new Schema<QuotationDetail>(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true, default: "USD" },
    description: { type: String, required: true, trim: true },
    pricingBreakdown: [
      {
        item: { type: String, trim: true },
        amount: { type: Number, min: 0 }
      }
    ],
    estimatedTimeline: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: QUOTATION_STATUSES,
      default: "pending"
    },
    sentAt: { type: Date, default: Date.now },
    responseDeadline: { type: Date },
    clientResponse: {
      status: { type: String, enum: QUOTATION_STATUSES },
      message: { type: String, trim: true },
      respondedAt: { type: Date }
    }
  },
  { _id: false }
);

const timelineEntrySchema = new Schema<TimelineEntry>(
  {
    stage: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ["pending", "in-progress", "completed"], default: "pending" },
    estimatedDuration: { type: String, required: true, trim: true },
    completedAt: { type: Date },
    notes: { type: String, trim: true }
  },
  { _id: false }
);

const customRequestSchema = new Schema<CustomRequestAttrs>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectTitle: { type: String, required: true, trim: true, index: true },
    projectType: {
      type: String,
      required: true,
      enum: PROJECT_TYPES,
      index: true
    },
    plotSize: { type: Number, required: true, min: 0 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    floors: { type: Number, required: true, min: 0 },
    budget: { type: Number, required: true, min: 0 },
    budgetCurrency: { type: String, required: true, uppercase: true, trim: true, default: "USD" },
    country: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true },
    architecturalStyle: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    functionalRequirements: [{ type: String, trim: true }],
    inspirationPreferences: [{ type: String, trim: true }],
    uploadedFiles: [projectFileSchema],
    status: {
      type: String,
      required: true,
      enum: REQUEST_STATUSES,
      default: "pending",
      index: true
    },
    quotation: quotationDetailSchema,
    assignedArchitect: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timeline: [timelineEntrySchema],
    adminNotes: { type: String, default: "", trim: true },
    clientMessages: [
      {
        senderType: { type: String, required: true, enum: ["client", "admin"] },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    completedAt: { type: Date }
  },
  { timestamps: true }
);

customRequestSchema.index({ user: 1, createdAt: -1 });
customRequestSchema.index({ status: 1, createdAt: -1 });
customRequestSchema.index({ projectType: 1, status: 1 });
customRequestSchema.index({ country: 1, createdAt: -1 });

export const CustomRequest = mongoose.model<CustomRequestAttrs>(
  "CustomRequest",
  customRequestSchema
);

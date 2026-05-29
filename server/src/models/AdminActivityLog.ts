import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";

export const ADMIN_ACTION_TYPES = [
  "plan-created",
  "plan-updated",
  "plan-deleted",
  "plan-published",
  "plan-featured",
  "order-status-changed",
  "user-suspended",
  "user-activated",
  "payment-verified",
  "custom-request-status-changed",
  "quotation-sent",
  "admin-login",
  "admin-logout",
  "report-generated",
  "settings-updated"
] as const;

export type AdminActionType = (typeof ADMIN_ACTION_TYPES)[number];

export interface AdminActivityLogAttrs {
  admin: Types.ObjectId;
  action: AdminActionType;
  targetModel?: string;
  targetId?: Types.ObjectId;
  description: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}

export type AdminActivityLogDoc = HydratedDocument<AdminActivityLogAttrs>;

const adminActivityLogSchema = new Schema<AdminActivityLogAttrs>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: ADMIN_ACTION_TYPES,
      index: true
    },
    targetModel: { type: String, trim: true, index: true },
    targetId: { type: Schema.Types.ObjectId, index: true },
    description: { type: String, required: true, trim: true },
    changes: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminActivityLogSchema.index({ admin: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, createdAt: -1 });
adminActivityLogSchema.index({ targetModel: 1, targetId: 1 });

export const AdminActivityLog = mongoose.model<AdminActivityLogAttrs>(
  "AdminActivityLog",
  adminActivityLogSchema
);

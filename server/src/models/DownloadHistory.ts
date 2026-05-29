import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";

export interface DownloadHistoryAttrs {
  user: Types.ObjectId;
  order: Types.ObjectId;
  plan: Types.ObjectId;
  fileName: string;
  downloadCount: number;
  lastDownloadedAt: Date;
}

export type DownloadHistoryDoc = HydratedDocument<DownloadHistoryAttrs>;

const downloadHistorySchema = new Schema<DownloadHistoryAttrs>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "HousePlan", required: true, index: true },
    fileName: { type: String, required: true, trim: true },
    downloadCount: { type: Number, required: true, default: 0, min: 0 },
    lastDownloadedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

downloadHistorySchema.index({ user: 1, order: 1, plan: 1, fileName: 1 }, { unique: true });

export const DownloadHistory = mongoose.model<DownloadHistoryAttrs>("DownloadHistory", downloadHistorySchema);

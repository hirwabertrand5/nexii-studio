import jwt from "jsonwebtoken";
import { DownloadHistory } from "../models/DownloadHistory.js";
import { HousePlan } from "../models/HousePlan.js";
import { Order } from "../models/Order.js";
import { AppError } from "../utils/AppError.js";
import { toObjectId } from "./planService.js";

function getDownloadSecret() {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new AppError("Download service is not configured", 500);
  return secret;
}

export async function prepareSecureDownload(userId: string, planId: string) {
  const order = await Order.findOne({
    user: userId,
    "plans.plan": planId,
    paymentStatus: "paid",
    orderStatus: "completed",
    downloadAccess: true
  }).sort({ createdAt: -1 });

  if (!order) {
    throw new AppError("No completed paid order with download access was found for this plan", 403);
  }

  const plan = await HousePlan.findById(planId).select("+digitalFiles.storageKey title filesIncluded status");
  if (!plan || plan.status !== "published") {
    throw new AppError("Plan is unavailable for download", 404);
  }

  const downloadFiles = plan.digitalFiles.length > 0
    ? plan.digitalFiles.map((file) => ({
        label: file.label,
        fileName: file.fileName,
        contentType: file.contentType ?? "application/octet-stream",
        sizeInBytes: file.sizeInBytes ?? null
      }))
    : plan.filesIncluded.map((fileName) => ({
        label: fileName,
        fileName,
        contentType: "application/octet-stream",
        sizeInBytes: null
      }));

  const bundleName = `${plan.title} secure bundle`;

  await DownloadHistory.findOneAndUpdate(
    {
      user: toObjectId(userId),
      order: order._id,
      plan: toObjectId(planId),
      fileName: bundleName
    },
    {
      $inc: { downloadCount: 1 },
      $set: { lastDownloadedAt: new Date() },
      $setOnInsert: {
        user: toObjectId(userId),
        order: order._id,
        plan: toObjectId(planId),
        fileName: bundleName
      }
    },
    { upsert: true, new: true }
  );

  const downloadToken = jwt.sign(
    {
      type: "plan-download",
      userId,
      orderId: String(order._id),
      planId
    },
    getDownloadSecret(),
    { expiresIn: "15m" }
  );

  return {
    plan: {
      id: String(plan._id),
      title: plan.title
    },
    orderId: String(order._id),
    files: downloadFiles,
    downloadToken,
    expiresIn: 900,
    deliveryMode: "secure-storage",
    message: "Download authorized. Use this short-lived token with the storage delivery layer."
  };
}

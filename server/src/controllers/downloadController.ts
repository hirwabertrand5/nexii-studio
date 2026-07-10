import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { HousePlan } from "../models/HousePlan.js";
import { Order } from "../models/Order.js";
import { prepareSecureDownload, verifyDownloadToken } from "../services/downloadService.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { assertValidObjectId, routeParam } from "../utils/validators.js";

function resolvePrivateFilePath(storageKey: string) {
  const match = storageKey.match(/^private:\/\/plan-files\/(.+)$/);
  if (!match) return null;

  const safeName = path.basename(match[1]);
  return path.resolve(process.cwd(), "private-uploads", "plan-files", safeName);
}

export async function downloadPlan(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const planId = routeParam(req.params.planId, "plan id");
  assertValidObjectId(planId, "plan id");
  const download = await prepareSecureDownload(userId, planId);
  return sendSuccess(res, { download });
}

export async function streamPlanFile(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const planId = routeParam(req.params.planId, "plan id");
  assertValidObjectId(planId, "plan id");
  const fileName = routeParam(req.params.fileName, "file name");
  const rawToken = req.query.token;
  const token = (() => {
    if (rawToken === undefined) return undefined;
    const candidate = Array.isArray(rawToken) ? rawToken[0] : rawToken;
    if (typeof candidate === "string") return candidate;
    if (candidate && typeof candidate === "object") return String(candidate);
    return undefined;
  })();

  if (!token) throw new AppError("Download token is required", 400);

  const payload = verifyDownloadToken(token);
  if (payload.userId !== userId || payload.planId !== planId) {
    throw new AppError("Invalid download token", 401);
  }

  const order = await Order.findOne({
    _id: payload.orderId,
    user: userId,
    paymentStatus: "paid",
    orderStatus: "completed",
    downloadAccess: true
  }).lean();

  if (!order) throw new AppError("Download access is not available for this file", 403);

  const plan = await HousePlan.findById(planId).select("+digitalFiles.storageKey status title");
  if (!plan || plan.status !== "published") throw new AppError("Plan is unavailable for download", 404);

  const digitalFile = plan.digitalFiles.find((file) => file.fileName === fileName || file.label === fileName);
  if (!digitalFile) {
    // Check if file is in filesIncluded but no actual storage file exists
    const isInFilesIncluded = plan.filesIncluded?.includes(fileName);
    if (!isInFilesIncluded) {
      throw new AppError("Requested file is not available", 404);
    }
    // File is listed but has no actual storage, return a friendly message
    throw new AppError("File is listed but has not been uploaded yet. Please contact support.", 400);
  }

  const absolutePath = resolvePrivateFilePath(digitalFile.storageKey);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    throw new AppError("Requested file is not available", 404);
  }

  res.setHeader("Content-Type", digitalFile.contentType ?? "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(digitalFile.fileName)}"`);
  res.sendFile(absolutePath);
}

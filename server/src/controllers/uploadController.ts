import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { getCloudinaryAdminUploadPayload } from "../services/cloudinaryImageService.js";
import { assertValidObjectId } from "../utils/validators.js";

export const createUploadSignature = asyncHandler(async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (!admin?._id) {
    throw new AppError("Unauthorized", 401);
  }

  const productId = typeof req.body?.productId === "string" ? req.body.productId.trim() : "";
  const slot = typeof req.body?.slot === "string" ? req.body.slot.trim() : "main";

  if (!productId) {
    throw new AppError("productId is required", 400);
  }

  assertValidObjectId(productId, "productId");

  const folder = `nexii/house-plans/${productId}`;
  const publicId = slot || "main";
  const payload = getCloudinaryAdminUploadPayload(folder, publicId);

  res.status(200).json(
    apiResponse(true, "Upload signature generated", {
      ...payload,
      folder,
      publicId
    })
  );
});

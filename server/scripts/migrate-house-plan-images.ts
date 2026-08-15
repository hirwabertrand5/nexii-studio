import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { connectDb } from "../src/config/db.js";
import { configureCloudinary } from "../src/config/cloudinary.js";
import { HousePlan, type PlanImage } from "../src/models/HousePlan.js";
import { uploadImageBufferToCloudinary } from "../src/services/cloudinaryImageService.js";

type MigrationReport = {
  migrated: number;
  alreadyMigrated: number;
  missingSource: number;
  invalidImage: number;
  failed: number;
};

function isCloudinaryUrl(value: string) {
  return /res\.cloudinary\.com/i.test(value) && value.includes("/image/upload/");
}

function extractUrl(value: PlanImage) {
  return typeof value === "string" ? value : value.url;
}

function extractPublicId(value: PlanImage) {
  if (typeof value !== "string") return value.publicId;
  if (!isCloudinaryUrl(value)) return undefined;

  const marker = "/image/upload/";
  const index = value.indexOf(marker);
  if (index === -1) return undefined;

  const tail = value.slice(index + marker.length);
  const withoutQuery = tail.split("?")[0] ?? tail;
  const withoutVersion = withoutQuery.replace(/^v\d+\//, "");
  const lastDot = withoutVersion.lastIndexOf(".");
  return lastDot > 0 ? withoutVersion.slice(0, lastDot) : withoutVersion;
}

function candidatePaths(imageValue: string) {
  const normalized = imageValue.replace(/^local:\/\//, "").replace(/^\/+/, "");
  return [
    imageValue,
    path.resolve(process.cwd(), normalized),
    path.resolve(process.cwd(), "uploads", normalized),
    path.resolve(process.cwd(), "..", "uploads", normalized),
    path.resolve(process.cwd(), "server", "uploads", normalized),
    path.resolve(process.cwd(), "..", "server", "uploads", normalized)
  ];
}

async function readImageBuffer(imageValue: string) {
  if (/^https?:\/\//i.test(imageValue)) {
    const response = await fetch(imageValue);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  for (const candidate of candidatePaths(imageValue)) {
    try {
      return await fs.readFile(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error("Source image not found");
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  configureCloudinary(process.env.NODE_ENV === "production");
  await connectDb(mongoUri);

  const report: MigrationReport = {
    migrated: 0,
    alreadyMigrated: 0,
    missingSource: 0,
    invalidImage: 0,
    failed: 0
  };

  const plans = await HousePlan.find().select("images previewImages title");
  for (const plan of plans) {
    let changed = false;
    const nextImages: PlanImage[] = [];

    for (let index = 0; index < (plan.images ?? []).length; index += 1) {
      const image = plan.images[index];
      const resolved = extractUrl(image);

      if (typeof image === "object" && image && "publicId" in image && image.publicId && "url" in image && image.url) {
        report.alreadyMigrated += 1;
        nextImages.push(image);
        continue;
      }

      if (!resolved || /^\s*$/.test(resolved)) {
        report.invalidImage += 1;
        continue;
      }

      if (isCloudinaryUrl(resolved)) {
        const publicId = extractPublicId(image);
        if (publicId) {
          nextImages.push({
            url: resolved,
            publicId,
            width: typeof image === "object" ? image.width : undefined,
            height: typeof image === "object" ? image.height : undefined,
            format: typeof image === "object" ? image.format : undefined
          });
          report.alreadyMigrated += 1;
        } else {
          report.invalidImage += 1;
        }
        continue;
      }

      try {
        const buffer = await readImageBuffer(resolved);
        const uploaded = await uploadImageBufferToCloudinary(buffer, {
          folder: `nexii/house-plans/${plan._id.toString()}`,
          publicId: index === 0 ? "main" : `gallery-${index}`
        });

        nextImages.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          width: uploaded.width,
          height: uploaded.height,
          format: uploaded.format
        });
        report.migrated += 1;
        changed = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.toLowerCase().includes("source image not found")) {
          report.missingSource += 1;
        } else {
          report.failed += 1;
        }
      }
    }

    if (changed && nextImages.length > 0) {
      plan.images = nextImages;
      if (Array.isArray(plan.previewImages) && plan.previewImages.length > 0) {
        plan.previewImages = nextImages.map((image) => image.url).slice(0, plan.previewImages.length);
      } else {
        plan.previewImages = nextImages.map((image) => image.url).slice(0, 3);
      }
      await plan.save();
    }
  }

  console.log("[migration] house-plan-images", report);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("[migration] failed", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});

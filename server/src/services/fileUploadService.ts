import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { getPublicUploadBaseUrl, getUploadStorageRoot } from "../utils/uploadStorage.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.S3_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      : undefined
});

function getUploadBaseUrl(override?: string) {
  const configured = override?.trim().replace(/\/$/, "") || getPublicUploadBaseUrl();
  if (configured) return configured;
  return `http://localhost:${process.env.PORT || 5000}`;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function uploadToLocal(buffer: Buffer, originalName: string, subdir = "requests", publicBaseUrl?: string) {
  const safeName = `${Date.now()}-${sanitizeFileName(originalName)}`;
  const relativePath = path.posix.join(subdir, safeName);
  const absolutePath = path.join(getUploadStorageRoot(), relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    key: relativePath.replace(/\\/g, "/"),
    url: `${getUploadBaseUrl(publicBaseUrl)}/uploads/${relativePath.replace(/\\/g, "/")}`
  };
}

export interface UploadedFileResult {
  fileName: string;
  storageKey: string;
  url?: string;
  contentType?: string;
  sizeInBytes?: number;
  fileType: "sketch" | "document" | "inspiration" | "other";
  uploadedAt: Date;
}

async function uploadToS3(buffer: Buffer, key: string, contentType?: string) {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("S3 bucket not configured");
  const uploadBaseUrl = (process.env.PUBLIC_UPLOAD_BASE_URL || `https://${bucket}.s3.${process.env.AWS_REGION || process.env.S3_REGION || "us-east-1"}.amazonaws.com`).replace(/\/$/, "");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable"
  });

  await s3Client.send(command);
  const url = `${uploadBaseUrl}/${key.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
  return { key, url };
}

export async function uploadBufferFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  sizeInBytes: number,
  fileType: "sketch" | "document" | "inspiration" | "other" = "other",
  options?: { publicBaseUrl?: string }
): Promise<UploadedFileResult> {
  const hasS3 = Boolean(process.env.S3_BUCKET || process.env.AWS_S3_BUCKET);

  if (!hasS3) {
    const local = await uploadToLocal(buffer, originalName, "requests", options?.publicBaseUrl);
    return {
      fileName: originalName,
      storageKey: `local://${local.key}`,
      url: local.url,
      contentType: mimetype,
      sizeInBytes,
      fileType,
      uploadedAt: new Date()
    };
  }

  // Build an S3 key including timestamp
  const ts = Date.now();
  const key = `requests/${ts}-${originalName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const s3res = await uploadToS3(buffer, key, mimetype);
  return {
    fileName: originalName,
    storageKey: `s3://${s3res.key}`,
    url: s3res.url,
    contentType: mimetype,
    sizeInBytes: sizeInBytes,
    fileType,
    uploadedAt: new Date()
  };
}

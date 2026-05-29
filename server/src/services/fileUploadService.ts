import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

// Configure Cloudinary if env present
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

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

export interface UploadedFileResult {
  fileName: string;
  storageKey: string;
  contentType?: string;
  sizeInBytes?: number;
  fileType: "sketch" | "document" | "inspiration" | "other";
  uploadedAt: Date;
}

async function uploadToCloudinary(buffer: Buffer, filename: string, folder = "nexii/requests") {
  return new Promise<{ public_id: string; secure_url: string; bytes: number }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("No result from Cloudinary"));
      resolve({ public_id: result.public_id!, secure_url: result.secure_url!, bytes: result.bytes! });
    });

    const read = stream.Readable.from(buffer);
    pipeline(read, uploadStream).catch(reject);
  });
}

async function uploadToS3(buffer: Buffer, key: string, contentType?: string) {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("S3 bucket not configured");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  await s3Client.send(command);
  const region = process.env.AWS_REGION || process.env.S3_REGION || "";
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
  return { key, url };
}

export async function uploadBufferFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  sizeInBytes: number,
  fileType: "sketch" | "document" | "inspiration" | "other" = "other"
): Promise<UploadedFileResult> {
  // If image and Cloudinary configured, prefer Cloudinary
  if (mimetype.startsWith("image/") && process.env.CLOUDINARY_CLOUD_NAME) {
    const res = await uploadToCloudinary(buffer, originalName);
    return {
      fileName: originalName,
      storageKey: `cloudinary://${res.public_id}`,
      contentType: mimetype,
      sizeInBytes: res.bytes,
      fileType,
      uploadedAt: new Date()
    };
  }

  // Else upload to S3
  if (!process.env.S3_BUCKET && !process.env.AWS_S3_BUCKET) {
    // Fallback: store to Cloudinary if available
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const res = await uploadToCloudinary(buffer, originalName);
      return {
        fileName: originalName,
        storageKey: `cloudinary://${res.public_id}`,
        contentType: mimetype,
        sizeInBytes: res.bytes,
        fileType,
        uploadedAt: new Date()
      };
    }

    throw new Error("No storage provider configured (S3 or Cloudinary)");
  }

  // Build an S3 key including timestamp
  const ts = Date.now();
  const key = `requests/${ts}-${originalName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const s3res = await uploadToS3(buffer, key, mimetype);
  return {
    fileName: originalName,
    storageKey: `s3://${s3res.key}`,
    contentType: mimetype,
    sizeInBytes: sizeInBytes,
    fileType,
    uploadedAt: new Date()
  };
}

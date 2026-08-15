import { Readable } from "stream";
import { AppError } from "../utils/AppError.js";
import { cloudinary, configureCloudinary, getCloudinaryPublicConfig } from "../config/cloudinary.js";

export interface CloudinaryImageUploadOptions {
  folder: string;
  publicId: string;
}

export interface CloudinaryImageUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

function assertCloudinaryReady() {
  const config = configureCloudinary(process.env.NODE_ENV === "production");
  if (!config.configured) {
    throw new AppError("Cloudinary is not configured", 503);
  }
  return config;
}

export function getCloudinaryAdminUploadPayload(folder: string, publicId: string) {
  const config = assertCloudinaryReady();
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureParams = {
    folder,
    public_id: publicId,
    timestamp,
    overwrite: true,
    unique_filename: false
  } as const;

  const signature = cloudinary.utils.api_sign_request(signatureParams, config.apiSecret);
  return {
    signature,
    timestamp,
    folder,
    publicId,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`
  };
}

export async function uploadImageBufferToCloudinary(
  buffer: Buffer,
  options: CloudinaryImageUploadOptions
): Promise<CloudinaryImageUploadResult> {
  const config = assertCloudinaryReady();
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: "image",
      overwrite: true,
      unique_filename: false,
      use_filename: false,
      invalidate: true
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error("Cloudinary upload returned no result"));
        return;
      }

      resolve({
        url: result.secure_url || result.url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      });
    }
  );

  let resolve!: (value: CloudinaryImageUploadResult) => void;
  let reject!: (reason?: unknown) => void;

  const uploadPromise = new Promise<CloudinaryImageUploadResult>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  Readable.from(buffer).pipe(stream);
  return uploadPromise;
}

export async function deleteCloudinaryImage(publicId: string) {
  if (!publicId) return;
  assertCloudinaryReady();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true
  });
}

export function getCloudinaryPublicUploadConfig() {
  return getCloudinaryPublicConfig();
}

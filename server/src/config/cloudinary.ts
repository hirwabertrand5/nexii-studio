import { v2 as cloudinary } from "cloudinary";

type CloudinaryEnv = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

let configured = false;

function readCloudinaryEnv(): CloudinaryEnv | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured() {
  return Boolean(readCloudinaryEnv());
}

export function configureCloudinary(required = false) {
  const env = readCloudinaryEnv();

  if (!env) {
    if (required) {
      throw new Error("Cloudinary environment variables are missing");
    }
    configured = false;
    return { configured: false as const };
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true
    });
    configured = true;
  }

  return {
    configured: true as const,
    cloudName: env.cloudName,
    apiKey: env.apiKey,
    apiSecret: env.apiSecret
  };
}

export function getCloudinaryPublicConfig() {
  const env = readCloudinaryEnv();
  if (!env) {
    return null;
  }

  return {
    cloudName: env.cloudName,
    apiKey: env.apiKey
  };
}

export { cloudinary };

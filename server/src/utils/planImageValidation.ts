import { AppError } from "./AppError.js";

const CLOUDINARY_SECURE_URL_PREFIX = "https://res.cloudinary.com/";

export function isCloudinarySecureUrl(value: unknown) {
  return typeof value === "string" && value.trim().startsWith(CLOUDINARY_SECURE_URL_PREFIX);
}

export function isLegacyUploadUrl(value: unknown) {
  return typeof value === "string" && value.includes("/uploads/");
}

export function ensureCloudinaryPlanImageUrls(values: string[], fieldName: string) {
  const invalidLegacy = values.find(isLegacyUploadUrl);
  if (invalidLegacy) {
    throw new AppError(`${fieldName} must use Cloudinary URLs, not legacy /uploads/ paths`, 400);
  }

  const invalidRemote = values.find((value) => !isCloudinarySecureUrl(value));
  if (invalidRemote) {
    throw new AppError(`${fieldName} must use Cloudinary secure URLs`, 400);
  }

  return values;
}

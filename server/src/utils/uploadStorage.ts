import type { Request } from "express";
import path from "path";

function normalizePath(value: string) {
  return value.replace(/\\/g, "/").replace(/\/$/, "");
}

export function getUploadStorageRoot() {
  const configured = [
    process.env.UPLOADS_DIR,
    process.env.RENDER_DISK_MOUNT_PATH ? path.join(process.env.RENDER_DISK_MOUNT_PATH, "uploads") : undefined
  ]
    .find((value) => typeof value === "string" && value.trim() !== "")
    ?.trim();

  if (configured) {
    return path.resolve(configured);
  }

  if (process.env.NODE_ENV === "production") {
    return path.resolve(process.cwd(), "uploads");
  }

  return path.resolve(process.cwd(), "..", "uploads");
}

export function getPrivateUploadStorageRoot() {
  const configured = process.env.PRIVATE_UPLOADS_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.join(getUploadStorageRoot(), "private");
}

export function getPublicUploadBaseUrl() {
  const configuredBaseUrl = [
    process.env.PUBLIC_UPLOAD_BASE_URL,
    process.env.PUBLIC_API_URL,
    process.env.BACKEND_URL,
    process.env.API_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.RENDER_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.VITE_API_URL
  ].find((value) => typeof value === "string" && value.trim() !== "");

  return normalizePath((configuredBaseUrl || "").trim());
}

export function getRequestPublicBaseUrl(req: Request) {
  const forwardedProto = typeof req.headers["x-forwarded-proto"] === "string"
    ? req.headers["x-forwarded-proto"].split(",")[0]?.trim()
    : undefined;
  const forwardedHost = typeof req.headers["x-forwarded-host"] === "string"
    ? req.headers["x-forwarded-host"].split(",")[0]?.trim()
    : undefined;
  const host = forwardedHost || req.get("host");
  const proto = forwardedProto || (req.secure ? "https" : "http");

  if (host) {
    return normalizePath(`${proto}://${host}`);
  }

  return getPublicUploadBaseUrl() || `http://localhost:${process.env.PORT || 5000}`;
}

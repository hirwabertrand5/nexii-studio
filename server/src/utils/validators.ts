import mongoose from "mongoose";
import { AppError } from "./AppError.js";

export function assertValidObjectId(id: string, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

export function toNumber(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(`${label} must be a valid number`, 400);
  }
  return parsed;
}

export function toOptionalNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return toNumber(value, label);
}

export function toPositiveNumber(value: unknown, label: string) {
  const parsed = toNumber(value, label);
  if (parsed < 0) {
    throw new AppError(`${label} must be zero or greater`, 400);
  }
  return parsed;
}

export function toPositiveInteger(value: unknown, label: string) {
  const parsed = toNumber(value, label);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(`${label} must be a whole number zero or greater`, 400);
  }
  return parsed;
}

export function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${label} is required`, 400);
  }
  return value.trim();
}

export function optionalString(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim();
}

export function stringArray(value: unknown, label: string, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new AppError(`${label} is required`, 400);
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(`${label} must be an array`, 400);
  }

  return value.map((item) => requiredString(item, label)).filter(Boolean);
}

export function enumValue<T extends string>(value: unknown, allowed: readonly T[], label: string) {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new AppError(`${label} must be one of: ${allowed.join(", ")}`, 400);
  }
  return value as T;
}

export function optionalEnumValue<T extends string>(value: unknown, allowed: readonly T[], label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return enumValue(value, allowed, label);
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function routeParam(value: string | string[] | undefined, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${label} is required`, 400);
  }
  return value;
}

export function optionalBoolean(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new AppError(`${label} must be true or false`, 400);
}

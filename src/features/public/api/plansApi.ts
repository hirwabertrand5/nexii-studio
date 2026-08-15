import { http } from "@/shared/api/http";
import { extractImageUrl, type ImageAssetLike, buildResponsiveSrcSet } from "@/shared/utils/image";

function withQuery(path: string, params?: Record<string, unknown>) {
  if (!params) return path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }
    searchParams.set(key, String(value));
  }

  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80";
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");

function getUploadsBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function resolveUploadsPath(pathname: string) {
  const base = getUploadsBaseUrl();
  return base ? `${base}${pathname}` : pathname;
}

function isLocalhostHost(hostname: string) {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}

export const SUPPORTED_PLAN_CATEGORIES = [
  { value: "bungalow", label: "Bungalow" },
  { value: "duplex", label: "Duplex" },
  { value: "modern-villa", label: "Modern Villa" },
  { value: "small-plot-home", label: "Small Plot Home" },
  { value: "african-contemporary", label: "African Contemporary" }
] as const;

export interface PublicPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PublicPlanSummary {
  _id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  plotSize: number;
  totalArea: number;
  architecturalStyle: string;
  category: string;
  images: Array<ImageAssetLike>;
  previewImages?: Array<ImageAssetLike>;
  filesIncluded?: string[];
  status?: string;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicPlanListResponse {
  plans: PublicPlanSummary[];
  pagination: PublicPagination;
}

export interface PublicPlanDetailResponse {
  plan: PublicPlanSummary;
  relatedPlans: PublicPlanSummary[];
}

export interface PublicPlanCategoryOption {
  value: string;
  label: string;
  count: number;
}

export function formatPlanCategoryLabel(category?: string) {
  if (!category) return "House Plan";

  const preset = SUPPORTED_PLAN_CATEGORIES.find((item) => item.value === category);
  if (preset) return preset.label;

  return category
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolvePlanImageUrl(src?: ImageAssetLike | null) {
  const extracted = extractImageUrl(src);
  if (!extracted) return fallbackImage;
  const value = String(extracted).trim();
  if (!value) return fallbackImage;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (isLocalhostHost(parsed.hostname) && parsed.pathname.startsWith("/uploads/")) {
        return resolveUploadsPath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      }
    } catch {
      // Keep the original URL if parsing fails.
    }

    return value;
  }

  if (value.startsWith("local://")) {
    return resolveUploadsPath(`/uploads/${value.replace("local://", "").replace(/^\/+/, "")}`);
  }
  if (value.startsWith("private://") || value.startsWith("cloudinary://") || value.startsWith("s3://")) {
    return fallbackImage;
  }
  if (value.startsWith("uploads/")) {
    return resolveUploadsPath(`/${value.replace(/^\/+/, "")}`);
  }
  if (value.startsWith("server/uploads/")) {
    return resolveUploadsPath(`/uploads/${value.replace(/^server\/uploads\//, "")}`);
  }
  if (value.startsWith("/uploads/")) return resolveUploadsPath(value);
  if (value.startsWith("/")) return value;
  if (/^(data:|blob:)/i.test(value)) return value;
  return fallbackImage;
}

export function getPlanImageSrcSet(src?: ImageAssetLike | null, widths: number[] = [320, 480, 640, 800, 1200, 1600]) {
  const resolved = resolvePlanImageUrl(src as ImageAssetLike);
  return buildResponsiveSrcSet(resolved, widths);
}

export function collectPlanCategories(plans: PublicPlanSummary[]): PublicPlanCategoryOption[] {
  const counts = new Map<string, number>();

  plans.forEach((plan) => {
    const value = plan.category?.trim();
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: formatPlanCategoryLabel(value),
      count
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const publicPlansApi = {
  getPlans: (params?: Record<string, unknown>) =>
    http<PublicPlanListResponse>(withQuery("/api/plans", params)),
  getPlanById: (id: string) =>
    http<PublicPlanDetailResponse>(`/api/plans/${id}`)
};

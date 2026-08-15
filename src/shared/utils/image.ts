export type ImageAssetLike =
  | string
  | null
  | undefined
  | {
      url?: unknown;
      secure_url?: unknown;
      publicId?: unknown;
      public_id?: unknown;
      width?: unknown;
      height?: unknown;
      format?: unknown;
    };

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

export function isCloudinaryDeliveryUrl(value: string) {
  return /res\.cloudinary\.com/i.test(value) && value.includes(CLOUDINARY_UPLOAD_MARKER);
}

export function extractImageUrl(value: ImageAssetLike) {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  const url = typeof value.url === "string" ? value.url.trim() : "";
  if (url) return url;

  const secureUrl = typeof value.secure_url === "string" ? value.secure_url.trim() : "";
  if (secureUrl) return secureUrl;

  return null;
}

function transformCloudinaryUrl(url: string, transformation: string) {
  if (!isCloudinaryDeliveryUrl(url)) return url;
  if (url.includes("/upload/" + transformation + "/")) return url;
  return url.replace(CLOUDINARY_UPLOAD_MARKER, `${CLOUDINARY_UPLOAD_MARKER}${transformation}/`);
}

export function buildResponsiveSrcSet(url: string, widths: number[] = [320, 480, 640, 800, 1200, 1600]) {
  if (!isCloudinaryDeliveryUrl(url)) return undefined;

  return widths
    .filter((width) => Number.isFinite(width) && width > 0)
    .map((width) => `${transformCloudinaryUrl(url, `f_auto,q_auto,w_${Math.round(width)}`)} ${Math.round(width)}w`)
    .join(", ");
}

export function buildCloudinaryDisplayUrl(url: string, width?: number) {
  if (!width || !isCloudinaryDeliveryUrl(url)) return url;
  return transformCloudinaryUrl(url, `f_auto,q_auto,w_${Math.round(width)}`);
}

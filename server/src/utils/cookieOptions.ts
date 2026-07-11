type SameSiteValue = "lax" | "none" | "strict";

export function getAuthCookieOptions(maxAge?: number) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as SameSiteValue,
    path: "/" as const,
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

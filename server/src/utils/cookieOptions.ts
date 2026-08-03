type SameSiteValue = "lax" | "none" | "strict";

export function getAuthCookieOptions(maxAge?: number) {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSiteEnv = process.env.AUTH_COOKIE_SAME_SITE?.toLowerCase() as SameSiteValue | undefined;
  const secureEnv = process.env.AUTH_COOKIE_SECURE?.toLowerCase();
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure: secureEnv ? secureEnv === "true" : isProduction,
    sameSite: sameSiteEnv ?? (isProduction ? "none" : "lax"),
    path: "/" as const,
    ...(domain ? { domain } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

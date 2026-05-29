const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class HttpError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function http<T>(
  path: string,
  options?: RequestInit & { token?: string | null }
): Promise<T> {
  const token = options?.token ?? null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {})
    }
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in (payload as any) && String((payload as any).message)) ||
      `Request failed (${res.status})`;
    throw new HttpError(res.status, message, payload);
  }
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: unknown }).success === true &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

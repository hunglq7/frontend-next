import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig | undefined;
    const isAuthRequest = request?.url?.startsWith("/auth/") ?? false;

    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshPromise ??= axios
        .post("/api/auth/refresh", undefined, { withCredentials: true })
        .then(() => undefined)
        .finally(() => {
          refreshPromise = null;
        });
      await refreshPromise;
      return await apiClient(request);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.location.assign(new URL("/signin", window.location.origin));
      }
      return Promise.reject(refreshError);
    }
  },
);

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const payload = error.response?.data as { message?: unknown } | undefined;
  if (typeof payload?.message === "string") return payload.message;
  if (Array.isArray(payload?.message)) return payload.message.join(", ");
  return fallback;
}
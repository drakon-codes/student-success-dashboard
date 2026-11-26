import axios, { isAxiosError } from "axios";
import { clearSession, getCurrentToken } from "./auth";

/**
 * The API address comes only from VITE_API_BASE_URL (.env). Nothing else in the app
 * hardcodes it. A value still containing the YOUR_PORT placeholder counts as unset.
 */
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  return (
    octets[0] === 10 ||
    octets[0] === 192 && octets[1] === 168 ||
    octets[0] === 172 && octets[1] !== undefined && octets[1] >= 16 && octets[1] <= 31
  );
}

function resolveApiBaseUrl(): string {
  if (!configuredApiBaseUrl || typeof window === "undefined") return configuredApiBaseUrl;
  try {
    const url = new URL(configuredApiBaseUrl);
    // The API and frontend run on the same computer. Loopback avoids cross-host
    // browser restrictions when this same private LAN API is accessed via localhost.
    if (window.location.hostname === "localhost" && isPrivateIpv4(url.hostname)) {
      url.hostname = "localhost";
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return configuredApiBaseUrl;
  }
}

export const API_BASE_URL = resolveApiBaseUrl();

export const isApiConfigured = API_BASE_URL.length > 0 && !/YOUR_PORT/i.test(API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function isLoginRequest(url: string | undefined, baseURL: string | undefined): boolean {
  if (!url) return false;
  try {
    const fallbackOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    return new URL(url, baseURL || fallbackOrigin).pathname.toLowerCase() === "/api/auth/login";
  } catch {
    return (url.toLowerCase().split("?")[0] ?? "").endsWith("/api/auth/login");
  }
}

api.interceptors.request.use((config) => {
  if (isLoginRequest(config.url, config.baseURL)) {
    config.headers.delete("Authorization");
    return config;
  }
  const token = getCurrentToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      !isLoginRequest(error.config?.url, error.config?.baseURL)
    ) {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  },
);

/** Accepts a plain JSON array or a System.Text.Json ReferenceHandler.Preserve wrapper. */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const values = (data as Record<string, unknown>)["$values"];
    if (Array.isArray(values)) return values as T[];
  }
  return [];
}

export function getHttpStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** Field errors from an ASP.NET Core ValidationProblemDetails response, keyed by camelCase field. */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error)) return {};
  const data = error.response?.data as { errors?: Record<string, unknown> } | undefined;
  const out: Record<string, string> = {};
  if (!data?.errors || typeof data.errors !== "object") return out;
  for (const [rawKey, value] of Object.entries(data.errors)) {
    const key = rawKey.replace(/^\$\./, "").split(".").pop() ?? rawKey;
    const field = key.charAt(0).toLowerCase() + key.slice(1);
    const message = Array.isArray(value) ? String(value[0] ?? "") : String(value);
    if (message) out[field] = message;
  }
  return out;
}

export function getApiErrorMessage(error: unknown): string {
  if (!isApiConfigured) {
    return "The API address isn't set yet. Add your port to VITE_API_BASE_URL.";
  }
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "The API took too long to respond.";
    if (!error.response) {
      return `Couldn't reach the API at ${API_BASE_URL}. Make sure it's running, its HTTPS certificate is trusted and CORS allows this site.`;
    }
    const { status, data } = error.response;
    if (data && typeof data === "object") {
      const d = data as { title?: unknown; detail?: unknown; message?: unknown };
      const errors = getValidationErrors(error);
      const first = Object.values(errors)[0];
      if (first) return first;
      if (typeof d.detail === "string" && d.detail) return d.detail;
      if (typeof d.message === "string" && d.message) return d.message;
      if (typeof d.title === "string" && d.title) return d.title;
    }
    if (typeof data === "string" && data.trim() && data.length < 300) return data;
    if (status === 404) return "Not found.";
    return `The API responded with status ${status}.`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

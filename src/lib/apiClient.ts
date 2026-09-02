"use client";

/**
 * Thin client-side fetch wrapper: attaches the CSRF header on every
 * mutating request (see src/server/security/csrf.ts) and normalizes error
 * handling against the { error: { code, message } } shape every route
 * handler returns via toSafeErrorResponse.
 */

let cachedCsrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  const res = await fetch("/api/auth/csrf");
  const data = await res.json();
  cachedCsrfToken = data.csrfToken;
  return cachedCsrfToken as string;
}

export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, code: string | undefined, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");

  if (method !== "GET") {
    headers.set("x-csrf-token", await getCsrfToken());
  }

  const res = await fetch(path, { ...options, method, headers, credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? "Something went wrong. Please try again.", data?.error?.code, res.status);
  }
  return data as T;
}

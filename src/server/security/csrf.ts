import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getEnv } from "../env";
import { CsrfError } from "./errors";

/**
 * Double-submit-cookie CSRF protection, layered on top of SameSite cookies
 * (defense in depth — SameSite alone has known gaps). See
 * docs/production/07-security-architecture.md §6.
 *
 * - On session creation, a random token is HMAC-signed and set in a
 *   non-HttpOnly cookie (the browser needs to read it to echo it back).
 * - Every state-changing request must include that same token in the
 *   `x-csrf-token` header.
 * - The server recomputes the HMAC and compares in constant time — it never
 *   needs to store the token server-side.
 */

const COOKIE_NAME = "gb_csrf";

function secret(): string {
  const env = getEnv();
  if (!env.CSRF_SECRET) {
    throw new Error("CSRF_SECRET is not set.");
  }
  return env.CSRF_SECRET;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function issueCsrfCookieValue(): string {
  const nonce = randomBytes(24).toString("hex");
  const signature = sign(nonce);
  return `${nonce}.${signature}`;
}

export async function setCsrfCookie() {
  const value = issueCsrfCookieValue();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: false, // must be readable by client JS to echo back in the header
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return value;
}

function isValidToken(token: string): boolean {
  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) return false;
  const expected = sign(nonce);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Call at the top of every state-changing route handler. Throws CsrfError
 * (403) if the cookie and header don't match a validly-signed token. */
export async function assertCsrf(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken || !isValidToken(cookieToken)) {
    throw new CsrfError();
  }
}

export const CSRF_COOKIE_NAME = COOKIE_NAME;

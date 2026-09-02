import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-compatible, lightweight gate: redirects to /login if there is no
 * session cookie at all for protected route prefixes. This is a UX
 * nicety only — it avoids a flash of protected content before redirect —
 * and is deliberately NOT the security boundary. The authoritative check
 * (does this cookie correspond to a valid, non-expired, non-revoked
 * Session row, does this user have the right role/scope) happens
 * server-side in the relevant layout via requireAuth()/requireAdminScope(),
 * which needs full Node.js/database access and therefore cannot live in
 * edge middleware. See docs/production/04-authentication-architecture.md §2.
 *
 * This proxy also sets a strict, nonce-based CSP (see cspRoutes.ts) for
 * every authenticated/credential-handling route it matches. Nonces must be
 * generated per-request here — next.config.ts's static headers() config has
 * no access to per-request randomness — and must be set on BOTH the
 * forwarded request headers (so Next's renderer can read the nonce back out
 * and apply it to its own inline bootstrap scripts) and the response
 * headers (so the browser enforces it). See Next's CSP guide at
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
 */

const SESSION_COOKIE = "gb_session";
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const isDev = process.env.NODE_ENV !== "production";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !request.cookies.get(SESSION_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    isDev ? "connect-src 'self' ws:" : "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  // Forwarded so server layouts (which have no other supported way to read
  // the current pathname) can make a narrow exception for /admin/setup-mfa
  // without an infinite redirect loop — see src/app/admin/layout.tsx.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

// Next requires `matcher` to be a literal, statically analyzable constant —
// a computed expression built from STRICT_CSP_PATH_PREFIXES would be
// silently ignored at build time. Keep this list in sync with
// STRICT_CSP_PATH_PREFIXES in src/lib/security/cspRoutes.ts by hand.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/mfa-challenge",
  ],
};

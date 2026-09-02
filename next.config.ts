import type { NextConfig } from "next";
// Relative import, not the "@/" alias: next.config.ts loads before the
// path-alias resolver is configured, so "@/" is not guaranteed to resolve
// here even though it works everywhere else in the app.
import { STRICT_CSP_PATH_PREFIXES } from "./src/lib/security/cspRoutes";

// Security headers applied to every response. See
// docs/production/07-security-architecture.md §1.
//
// CSP is split in two:
//  - Authenticated/credential-handling routes (dashboard, admin, login,
//    register, password reset, etc. — see cspRoutes.ts) get a strict,
//    nonce-based CSP set per-request by proxy.ts. Those routes already read
//    cookies()/tokens to render, so they're dynamically rendered regardless
//    — a nonce (which requires dynamic rendering, since it's fresh per
//    request) costs nothing extra there.
//  - Everything else (public marketing pages) gets the relaxed, static CSP
//    below, which keeps static optimization/ISR/CDN caching working. These
//    pages hold no sensitive data, so 'unsafe-inline' is an acceptable
//    trade-off there.
//
// Both need 'unsafe-inline' (or a nonce) because Next's own bootstrap emits
// unnonced inline <script> tags — e.g. the `self.__next_r=...`
// hydration-request-id script — that a strict script-src silently blocks,
// which prevents the app from ever hydrating: no useEffects run, no event
// listeners attach, and any Suspense/next-dynamic boundary throws React
// error #412 "Connection closed" because the client runtime that would
// resolve it never started. Dev additionally needs 'unsafe-eval' (React/Fast
// Refresh reconstruct server error stacks via eval). See Next's CSP guide at
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
const isDev = process.env.NODE_ENV !== "production";

const publicContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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

const baseSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

// Matches every path except the strict-CSP ones, which proxy.ts handles.
// Keeps the two CSPs from ever both applying to the same request.
const strictCspPathPattern = STRICT_CSP_PATH_PREFIXES.map((p) => p.slice(1)).join("|");
const publicPathSource = `/((?!${strictCspPathPattern}).*)`;

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: baseSecurityHeaders,
      },
      {
        source: publicPathSource,
        headers: [{ key: "Content-Security-Policy", value: publicContentSecurityPolicy }],
      },
    ];
  },
};

export default nextConfig;

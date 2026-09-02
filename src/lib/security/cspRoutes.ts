// Route prefixes that get a strict, nonce-based CSP (no 'unsafe-inline' /
// 'unsafe-eval' in production) instead of the relaxed static-friendly CSP:
// everywhere a session is authenticated or credentials/tokens are handled.
// These routes already read cookies() or auth tokens to render, so they're
// dynamically rendered regardless — trading static optimization for a nonce
// costs nothing here. Public marketing pages keep static rendering plus a
// relaxed CSP, since they hold no sensitive data.
//
// Shared by next.config.ts (relaxed CSP, everything NOT matching this list)
// and proxy.ts (strict nonce CSP, everything matching this list) so the two
// policies can never overlap onto the same request. See Next's CSP guide at
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
export const STRICT_CSP_PATH_PREFIXES = [
  "/dashboard",
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/mfa-challenge",
];

# Phase 3 — Authentication Architecture

Replaces `src/lib/authStore.ts` and the `localStorage`-based session entirely. Nothing from the current implementation is reused.

## 1. Passwords

- Hashed with **Argon2id** (memory-hard, resistant to GPU cracking), tuned to the OWASP-recommended parameters for the deployment hardware (target ≥250ms hash time server-side).
- Never logged, never included in error messages, never sent in any API response, never stored anywhere but the `User.passwordHash` column.
- Password policy enforced server-side (minimum length/entropy check against a breached-password list such as HaveIBeenPwned's k-anonymity API) — not just a client-side regex.
- Changing a password invalidates all other sessions for that user (`Session.revokedAt` set, `revokedReason = "password_changed"`) and triggers a login notification (§7).

## 2. Sessions

- On successful authentication, the server creates a `Session` row and returns its id in a cookie with:
  - `HttpOnly` — inaccessible to JavaScript, closing the exact hole the current `localStorage` approach has.
  - `Secure` — never sent over plain HTTP.
  - `SameSite=Lax` (or `Strict` for the admin console) — mitigates CSRF for the common case; combined with §4 for state-changing requests.
  - A short server-side TTL (e.g. 30 minutes idle, 12 hours absolute), refreshed on activity, independent of the "remember me" checkbox which only extends the absolute TTL.
- The cookie value is an **opaque session id**, not a JWT containing role/claims — this lets us revoke a session instantly by deleting/marking the row, which a self-contained signed token cannot do without a denylist (which is just a session store by another name). Role and permissions are looked up server-side on every request from the `User`/`AdminPermission` tables, never trusted from the client.
- Every request handler resolves `session → user → role/permissions` server-side before doing anything else. This is the direct replacement for `useRequireAuth`, which only ran client-side after the page had already rendered.

## 3. Multi-factor authentication

- TOTP (authenticator app) as the primary second factor; WebAuthn/passkeys as a stronger optional upgrade; SMS only as a fallback (documented as the weakest option, offered but not encouraged).
- MFA is **mandatory for the admin console**, regardless of individual admin preference (see [07-security-architecture.md](./07-security-architecture.md#admin-mfa)).
- MFA is strongly encouraged (and step-up enforced for sensitive actions — adding a beneficiary, raising a transfer limit) for customers, mandatory where the client's regulatory obligations require it.
- TOTP secrets are encrypted at rest (`MfaMethod.secretEnc`) using the same KMS-backed envelope encryption as other sensitive fields — never stored or logged in plaintext.

## 4. CSRF protection

- Double-submit or synchronizer-token pattern on every state-changing (`POST`/`PUT`/`PATCH`/`DELETE`) route handler, in addition to `SameSite` cookies — defense in depth, since `SameSite` alone has known gaps (subdomain takeovers, older browsers).
- Route handlers reject requests missing a valid CSRF token with `403`, logged as a `SecurityEvent` if the rate of such failures spikes for a given session/IP (possible attack, not just a bug).

## 5. Rate limiting & brute-force / account lockout

- Login attempts are rate-limited per IP **and** per account (Redis sliding window), so an attacker can't route around a per-IP limit by rotating IPs against one target account.
- After a configurable threshold of failed attempts (`User.failedLoginCount`), the account is temporarily locked (`User.lockedUntil`) with an unlock path via verified email/MFA — not an indefinite silent lock that generates support tickets.
- Every failed attempt writes a `SecurityEvent(type: LOGIN_FAILURE)` row; a burst of failures triggers an alert (see monitoring in [08](./08-deployment-architecture.md)) and, once a risk-scoring provider is integrated, a fraud-signal lookup.

## 6. Device & session management

- `Device` rows fingerprint returning browsers/apps (not solely by cookie, which resets — combination of signals, no invasive fingerprinting beyond what's needed for fraud detection).
- Customers see and can revoke active sessions from **Security → Active Sessions** (the current UI already has this screen in `src/app/dashboard/security/page.tsx` — it becomes a real `Session` list with a real "sign out" action instead of static mock rows).
- A login from an unrecognized device triggers `SecurityEventType.LOGIN_NEW_DEVICE`, a notification to the user (§7), and, depending on risk score, a step-up MFA challenge before the session is fully trusted.

## 7. Login notifications & suspicious-login detection

- Every successful login sends a notification (email at minimum, in-app always) with device, approximate location (IP-derived, not GPS), and a "this wasn't me" link that immediately revokes the session and forces a password reset.
- "Suspicious" heuristics that gate a step-up challenge rather than a silent allow:
  - New device/browser fingerprint.
  - Geographically implausible sequence of logins ("impossible travel").
  - IP reputation flags (via the fraud/risk provider once integrated — not invented locally).
  - Elevated velocity of failed attempts immediately preceding a success (credential-stuffing pattern).
- These heuristics start simple (device + geo) and are designed to plug into a real fraud provider's risk score (`SecurityEvent.riskScore`) once one is selected — see [06-banking-provider-integration.md](./06-banking-provider-integration.md).

## 8. Password reset

- Time-boxed, single-use, cryptographically random token (not the session id, not predictable), emailed to the verified address only, invalidated after use or after a short TTL (e.g. 15 minutes).
- Reset does not reveal whether an email exists in the system (generic "if an account exists, we've sent a link" response) to avoid user enumeration.
- Successful reset revokes all existing sessions and triggers a notification, exactly like a password change.

## 9. What changes in the codebase (summary, not yet implemented)

| Current | Replaced by |
|---|---|
| `src/lib/authStore.ts` (Zustand + localStorage) | Server session issued via `/api/auth/*` route handlers; client holds no auth state beyond "am I logged in" derived from a `/api/auth/session` call |
| `signIn()` accepting any password | `/api/auth/login` verifying Argon2id hash, enforcing rate limits/lockout, issuing MFA challenge if enabled |
| `role` inferred from email substring | `role`/`AdminPermission` read from the database on every request |
| `useRequireAuth` client redirect | Server-side auth check in route handlers/middleware; client-side redirect kept **only** as a UX nicety for already-rejected requests, never as the actual gate |
| No MFA | TOTP/WebAuthn enrollment flow under Security settings |
| `Forgot password?` linking to `href="#"` | Real `/api/auth/password-reset/*` flow per §8 |

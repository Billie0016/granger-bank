# Phase 7 & 8 — Security Architecture (including Admin RBAC)

## 1. Transport & headers

- **TLS/HTTPS everywhere**, terminated at the load balancer/CDN, with HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) once the domain is confirmed ready for preload.
- Security headers applied via Next.js middleware/config on every response:
  - `Content-Security-Policy` — default-src 'self', explicit allowlist for the 3D/font/analytics origins actually used, no `unsafe-inline` for scripts (styles may need a nonce or hash strategy given Tailwind/inline SVG usage — resolved during implementation, not loosened by default).
  - `X-Frame-Options: DENY` / `frame-ancestors 'none'` in CSP — the banking UI is never embeddable.
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restricting camera/mic/geolocation to nothing by default.

## 2. Encryption

- **In transit**: TLS 1.2+ to the browser; TLS to Postgres, Redis, and every provider API — no plaintext internal traffic assumed "safe because it's internal."
- **At rest**:
  - Database: encryption at rest at the storage layer (managed Postgres offerings provide this; verify and enable explicitly).
  - Field-level encryption (application-layer, KMS-backed envelope encryption) for the specific columns flagged `*Enc` in [03-database-schema.md](./03-database-schema.md) — tax ID, beneficiary account numbers, MFA secrets. This is a second layer beyond disk encryption, because disk encryption alone doesn't protect against a compromised database credential or a misconfigured backup export.
  - Backups encrypted with a separate key from the live database where the backup provider supports it.

## 3. Cookies & session security

Covered in depth in [04-authentication-architecture.md](./04-authentication-architecture.md#2-sessions) — `HttpOnly`, `Secure`, `SameSite`, short TTL, server-side revocation.

## 4. Input validation & output encoding

- Every route handler validates its input against an explicit schema (e.g. Zod) before touching a service — rejecting unknown fields, enforcing types/ranges (amounts positive and within sane bounds, currency codes from an allowlist, string fields length-capped) — not just relying on TypeScript types, which don't exist at runtime.
- Output encoding: React's default JSX escaping handles most XSS surface; the specific risk areas are (a) any `dangerouslySetInnerHTML` (none currently in the codebase, and none planned), and (b) data rendered into non-HTML contexts (CSV/PDF statement export, email templates) which get their own contextual encoding.

## 5. Injection protection

- **SQL injection**: eliminated structurally by using Prisma's parameterized query builder exclusively; any future raw-SQL escape hatch (`$queryRaw`) requires tagged-template parameterization and a code-review flag, never string concatenation.
- **NoSQL/command injection**: not applicable to the current stack (no shell-outs, no NoSQL datastore), documented here so it's revisited if that changes.

## 6. CSRF, rate limiting, brute-force protection

Covered in [04-authentication-architecture.md](./04-authentication-architecture.md#4-csrf-protection) and [§4-5 there](./04-authentication-architecture.md#5-rate-limiting--brute-force--account-lockout). Applied specifically:
- Auth endpoints: tightest limits (e.g. 5 attempts / 15 min / account, separate IP-based limit).
- Transfer/payment endpoints: rate-limited per customer to blunt automated abuse even from an authenticated, valid session.
- Public endpoints (contact form, if it gains a real backend): CAPTCHA or equivalent bot mitigation plus rate limiting.

## 7. Audit logging

- Every sensitive action — login, password/MFA change, beneficiary added, transfer created/approved/rejected, card frozen/unfrozen, any admin action touching a customer record or permission — writes an `AuditLog` row (schema in [03](./03-database-schema.md)).
- Audit logs are **append-only at the database grant level**: the application's runtime Postgres role has `INSERT` but not `UPDATE`/`DELETE` on `AuditLog` and `TransactionStatusEvent`. Only a break-glass migration role, used exclusively for schema changes and never for data edits, has broader access.
- Audit logs are shipped to a separate, immutable-storage destination (e.g. write-once log bucket) on a schedule, so a database compromise doesn't also compromise the audit history.

## 8. Privilege separation & Admin RBAC

Replaces the current model where any authenticated "admin" (in practice: anyone who typed an email containing "admin") sees every admin page with full access.

**Roles** (matching the brief's examples), implemented as the `AdminScope` enum + `AdminPermission` join table in the schema, not as a single `role: "admin"` flag:

| Role (illustrative bundle of scopes) | Typical scopes granted |
|---|---|
| Super Admin | All scopes, including `ADMIN_MANAGE` (granting/revoking other admins) |
| Operations | `ACCOUNTS_VIEW`, `ACCOUNTS_MANAGE`, `CARDS_MANAGE`, `TRANSACTIONS_VIEW` |
| Customer Support | `CUSTOMERS_VIEW`, `SUPPORT_RESPOND`, `TRANSACTIONS_VIEW` (read-only on financial data) |
| Compliance | `COMPLIANCE_REVIEW`, `AUDIT_LOG_VIEW`, `CUSTOMERS_VIEW`, KYC review access |
| Risk/Fraud | `RISK_REVIEW`, `TRANSFERS_APPROVE`, `AUDIT_LOG_VIEW` |

Rules:
- **Scopes are granted individually**, not as a fixed role name baked into code — "Operations" above is a convenient bundle, but the enforcement point is always "does this admin have scope X," checked server-side on every admin route/action.
- **Every scope grant/revoke is itself an audited action** (`AuditLog.action = "admin.permission_granted"`, actor = the granting Super Admin) — satisfying "every sensitive administrative action must create an audit record" for the meta-level action of managing admins too.
- **No admin, including Super Admin, can approve their own high-risk action** where dual control matters (e.g., a large manual balance `ADJUSTMENT` transaction type requires a second admin's approval — enforced by requiring a distinct `actorUserId` on the approving `TransactionStatusEvent`).
- The current single admin sidebar (`src/app/admin/layout.tsx`) is replaced with a sidebar whose items are filtered by the logged-in admin's actual scopes — a Customer Support admin does not see "Settings" or "Audit Logs" navigation items they have no permission to open, not just a page that 403s if they guess the URL (both — hidden nav *and* server-enforced 403, never nav-hiding alone).

## 9. Admin MFA

**Mandatory, not optional, for every admin account, regardless of scope.** No admin route is reachable without a session that was established with a completed MFA challenge — enforced server-side on the admin route group, mirroring but stricter than the customer-side policy in [04](./04-authentication-architecture.md#3-multi-factor-authentication).

## 10. Session expiration

- Customer sessions: idle timeout + absolute timeout per [04](./04-authentication-architecture.md#2-sessions).
- Admin sessions: shorter idle timeout (e.g. 15 minutes) given the sensitivity of what's accessible, and no "remember me" extension.

## 11. Suspicious activity detection

Covered in [04-authentication-architecture.md §7](./04-authentication-architecture.md#7-login-notifications--suspicious-login-detection) for login; extended on the transaction side via the `FraudRiskProvider` interface in [06](./06-banking-provider-integration.md#2-provider-abstraction-interfaces) — velocity checks, amount-threshold checks, and (once integrated) provider risk scores gate transfers into `PENDING_RISK_REVIEW` rather than auto-authorizing.

## 12. Minimizing exposure of financial information

- API responses are shaped per-endpoint (never a generic "return the whole customer record") so a transaction-list endpoint doesn't incidentally leak another account's data or an admin-only field to a customer-scoped token.
- Masked values (`•••• 4827`, last4 only) are the default display everywhere; full account/card numbers are never rendered client-side even for the account owner, mirroring how the current UI already masks card numbers by design (`src/components/three/cardFaceTexture.ts`, `StaticCardFallback.tsx`) — that pattern is extended to be true of the *data*, not just the 3D card's visual design.
- Admin views of customer financial data are scoped to what that admin's role needs (Customer Support sees enough to help with a ticket, not full transaction-level detail across the institution) and every view is itself logged as an access event where the data is sufficiently sensitive (compliance-grade "who looked at this customer's account" trail).

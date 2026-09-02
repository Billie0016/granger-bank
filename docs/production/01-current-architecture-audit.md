# Phase 1 — Current Architecture Audit

Scope: the entire `granger-bank` repository as it exists today. Every claim below was verified by reading the source (file paths and line numbers cited), not inferred.

## 1. High-level summary

| Layer | Current state |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4. Real. |
| Backend / API | **Does not exist.** No `src/app/api/*`, no `route.ts` anywhere in the repo. |
| Database | **Does not exist.** No ORM, no schema, no connection string, no persistence beyond the browser. |
| Authentication | Client-side only, backed by `localStorage`. Accepts any credentials. |
| Authorization | Client-side route guards only, trivially bypassable. |
| Financial data | Hardcoded TypeScript arrays, identical for every visitor, reset on logout. |
| Environment variables | **None used anywhere in the app** (`grep -rn "process.env" src` returns nothing). |
| Secrets | None exist, which also means none are currently leaking — but there is also no mechanism to hold them. |

**Bottom line:** this is a static/client-rendered mockup. It is well-built as a design prototype, but architecturally it has none of the pieces a bank needs — there is nothing to "harden," there is a real backend to build from zero.

## 2. Demo authentication

**File:** [`src/lib/authStore.ts`](../../src/lib/authStore.ts)

- A Zustand store persisted to `localStorage` under the key `granger-bank-demo-auth`.
- `signIn(email, role)` sets `isAuthenticated: true` unconditionally — it is called by the login page regardless of what the user typed.
- There is no password field in the store at all. The password the user types is captured in component state and **never read, never validated, never sent anywhere.**

**File:** [`src/app/login/page.tsx`](../../src/app/login/page.tsx) lines 21–28:

```ts
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  const role = email.toLowerCase().includes("admin") ? "admin" : "customer";
  setTimeout(() => {
    signIn(email || "demo@grangerbank.example", role);
    router.push(role === "admin" ? "/admin" : "/dashboard");
  }, 500);
}
```

Findings:
- **Any string in the password field succeeds.** There is no verification step.
- **Role escalation is one keystroke away.** Typing any email containing the substring `"admin"` (e.g. `admin@x.com`, `notadmin@test.com`) grants the admin role and full admin console access. This is decided entirely in the browser.
- The 500ms `setTimeout` exists only to simulate network latency for the loading spinner — it has no security function.

## 3. localStorage-based session state

**File:** `src/lib/authStore.ts`, `src/lib/hooks/useRequireAuth.ts`

- "Session" = a JSON blob in `localStorage`, readable and writable by any JavaScript running on the page (including, in a real deployment, any XSS payload, any browser extension, or the user themselves via devtools).
- `useRequireAuth` ([`src/lib/hooks/useRequireAuth.ts`](../../src/lib/hooks/useRequireAuth.ts)) is a `useEffect` that runs *after* the protected page has already rendered once, then redirects if `isAuthenticated` is false. This is route-guarding as a UX courtesy, not a security boundary — the protected page's JSX, and anything it fetches, has already executed in the browser before the redirect fires.
- There is no server-side session, no HttpOnly cookie, no token of any kind. Nothing prevents a user from running `localStorage.setItem('granger-bank-demo-auth', ...)` with `isAuthenticated: true, role: "admin"` in the devtools console and loading `/admin` directly. (This is in fact how QA verified the admin console during the prototype phase — see prior session.)

## 4. Mock financial data (all of it lives in one file)

**File:** [`src/lib/mockData.ts`](../../src/lib/mockData.ts) — 160 lines, 19 exports, zero I/O.

| Export | Line | What it fakes |
|---|---|---|
| `accounts` | 29 | Customer's 3 accounts (checking/savings/business) and their balances |
| `totalBalance` | 56 | Sum of the above, computed client-side |
| `monthlySpending`, `savingsGrowthPct` | 58–59 | Hardcoded KPI numbers shown on the homepage and dashboard |
| `spendingByMonth`, `spendingByCategory` | 61, 70 | Chart data for every "analytics" visualization |
| `transactions` | 78 | The customer's entire transaction history — 10 fixed rows |
| `cards` | 91 | The customer's debit/credit cards and their status |
| `beneficiaries` | 97 | Saved payees for the transfer/payment flows |
| `notifications` | 103 | The customer's notification feed |
| `adminCustomers` | 110 | The entire "customer base" the admin console manages |
| `auditLogs` | 119 | Fabricated audit trail entries |
| `adminAccounts` | 127 | Every account the admin console lists, across all customers |
| `adminTransactions` | 137 | Every transaction the admin fraud/monitoring views show |
| `supportTickets` | 146 | The admin support queue |

This one file is imported by **17 different page/component files** (verified via `grep -rl`), including every customer dashboard page, every admin page, and two homepage marketing sections. **All of it is identical, static, and shared by every user of the app** — there is no per-user data model at all. "Alex Morgan's balance" is not stored anywhere per-user; it's a constant.

## 5. Mock transfers, payments, and card actions

- [`src/app/dashboard/transfers/page.tsx`](../../src/app/dashboard/transfers/page.tsx): the transfer "confirmation" is `setDone(true)` — a local React state flip. No balance anywhere is changed, no request leaves the browser. The confirmation copy explicitly says "This is a demo — no real funds were moved," which is honest but underscores there is no backend to call.
- [`src/app/dashboard/payments/page.tsx`](../../src/app/dashboard/payments/page.tsx): identical pattern — local state, no backend call.
- [`src/app/dashboard/cards/page.tsx`](../../src/app/dashboard/cards/page.tsx) and [`src/app/admin/cards/page.tsx`](../../src/app/admin/cards/page.tsx): "Freeze card" toggles a field in a `useState` array seeded from `cards`/mock data. Refreshing the page reverts it, because nothing persisted.
- [`src/app/admin/transfers/page.tsx`](../../src/app/admin/transfers/page.tsx): "Approve" / "Hold" buttons mutate local component state only. No real transfer exists to approve.
- [`src/app/dashboard/statements/page.tsx`](../../src/app/dashboard/statements/page.tsx): statement "download" buttons render a list of month labels; there is no PDF, no file, no generation logic behind them.

**None of this is a security bug in isolation** — there's no real money to protect yet — but every one of these interaction points is where a production build must insert a real authorization + provider call instead of a `setState`.

## 6. Client-side security weaknesses (architectural, not implementation bugs)

These are not "bugs to fix" so much as "things that are structurally impossible to fix without a backend":

1. **No trust boundary exists.** Everything — auth, role, balances, transaction history — lives in the browser. A backend is not hardened here; it is absent.
2. **Role is self-asserted.** The `role` field the UI reads to decide whether to show the admin console is stored in the same `localStorage` object the user's own browser controls.
3. **No CSRF exposure yet** (no state-changing server endpoints exist to attack) but also **no CSRF protection scaffolding** to build on.
4. **No rate limiting, no lockout, no brute-force protection** — there is nothing to brute-force yet, since the password is never checked.
5. **No input validation or output encoding layer** — form inputs (email, transfer amount, beneficiary details) are typed as strings/numbers in React state with only HTML5 `required`/`type="number"` constraints; nothing resembling server-side schema validation exists because there is no server.
6. **No security headers.** [`next.config.ts`](../../next.config.ts) is the default scaffold — no CSP, no `Strict-Transport-Security`, no `X-Frame-Options`, nothing.
7. **No `middleware.ts`.** There is no edge-level request interception for auth, geo, or bot mitigation.

## 7. API endpoints

**None.** `find src/app -iname api` and `find src -iname route.ts` both return empty. There is no server-side code path in this application at all — every page is either statically prerendered or a client component.

## 8. Database usage

**None.** No Prisma, Drizzle, or raw SQL client is installed (`package.json` has no such dependency). No connection string, no migration folder, no schema file exists anywhere in the repo.

## 9. Environment variables

**None declared, none read.** No `.env`, `.env.local`, or `.env.example` file exists. `grep -rn "process.env" src` returns zero matches. This means:
- There is currently nothing to leak (no secrets in source), which is good.
- There is also no established pattern for configuration, which Phase 6/8/9 of this package establishes from scratch.

## 10. Authentication implementation (mechanism-level)

- Password hashing: **none** — passwords aren't stored or checked at all.
- Session tokens: **none** — `localStorage` boolean flag only.
- MFA: **none.**
- Password reset: UI link present (`Forgot password?` in `login/page.tsx`) but it points to `href="#"` — no flow behind it.

## 11. Authorization implementation (mechanism-level)

- `useRequireAuth(requiredRole)` ([`src/lib/hooks/useRequireAuth.ts`](../../src/lib/hooks/useRequireAuth.ts)) is the entire authorization system. It is a client-side redirect that runs in a `useEffect`, gating `/dashboard/*` on `role === "customer"` and `/admin/*` on `role === "admin"`.
- Because `role` is client-controlled state, this provides **zero real access control**. It correctly prevents accidental navigation in the demo (e.g., a customer clicking around and landing on `/admin` by mistake) but provides no protection against a deliberate actor.
- There is no concept of per-resource ownership anywhere (e.g., nothing checks "does this account belong to this customer," because there is only ever one customer's data, shared globally).

## 12. What is explicitly *not* wrong here

To be precise about scope: the visual/UX layer (React Three Fiber card, Tailwind design system, component structure, Next.js App Router usage) is sound and is largely being **kept** in the production rebuild (see [Phase 11 in the production architecture doc](./02-production-architecture.md#frontend)). The problem addressed by this package is entirely the absence of a backend, a database, and real authentication/authorization — not the UI code quality.

## 13. Audit conclusion

Every item in the brief's Phase 1 checklist maps to "does not exist, is hardcoded, or is client-only":

- Demo authentication → confirmed, `authStore.ts` + `login/page.tsx`
- localStorage authentication → confirmed, same files
- Mock transaction/balance/beneficiary/transfer/card/statement/admin data → confirmed, all 19 exports of `mockData.ts`
- Hardcoded financial information → confirmed, same file
- Client-side security weaknesses → confirmed, structural (no backend to secure)
- API endpoints → **none exist**
- Database usage → **none exists**
- Environment variables → **none declared**
- Authentication implementation → **none** (accepts anything)
- Authorization implementation → **client-side only, spoofable**

This is the expected state for a prototype and is the correct baseline to build the production architecture in the following documents against.

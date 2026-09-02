# Implementation Phases and Estimates

Estimates assume one focused engineering team (roughly 2–4 engineers) and are for the **architecture and non-financial-provider-dependent work**. Anything gated on a named banking/KYC provider (marked **[BLOCKED]**) cannot start in earnest until [09-client-requirements-and-credentials.md](./09-client-requirements-and-credentials.md) is resolved — that work is sequenced last for a reason, not because it's less important.

| # | Phase | Depends on | Rough estimate | Notes |
|---|---|---|---|---|
| 1 | Foundations: Postgres + Prisma schema, Redis, base Next.js server structure, environment separation, CI pipeline with the demo-data/prod-safety checks from [08 §4](./08-deployment-architecture.md#4-preventing-demo-data--mock-providers-from-reaching-production) | This package's approval | 2–3 weeks | No provider dependency. Can start immediately on approval. |
| 2 | Authentication & session system per [04](./04-authentication-architecture.md): password hashing, sessions, CSRF, rate limiting/lockout, MFA enrollment, password reset, login notifications | Phase 1 | 3–4 weeks | No provider dependency. Replaces `authStore.ts` entirely. |
| 3 | Admin RBAC per [07 §8–9](./07-security-architecture.md#8-privilege-separation--admin-rbac): permission model, admin MFA enforcement, scoped nav/route guards, audit logging plumbing | Phase 1, 2 | 2 weeks | No provider dependency. |
| 4 | Provider abstraction layer per [06](./06-banking-provider-integration.md): interfaces, fail-closed stub implementations, `DevStubProvider` for local dev, wiring every UI action (transfer, payment, freeze card, statement) to a real request that currently fails closed with a clear message | Phase 1 | 2–3 weeks | No provider dependency — this is exactly the work that de-risks the eventual integration and removes `mockData.ts`. **This phase is what turns the prototype into "production architecture with no fake success paths," even before a provider is chosen.** |
| 5 | Customer account/profile data model live end-to-end: real per-user accounts, real (empty, provider-pending) transaction history, dashboard reading from the database instead of `mockData.ts` | Phase 1, 4 | 2 weeks | No provider dependency for the plumbing; balances/transactions will correctly show "unavailable — provider not configured" until Phase 8. |
| 6 | KYC/onboarding workflow scaffolding per [Phase 9 schema](./03-database-schema.md#customer--kyc): signup flow, document upload UI, `KycRecord` state machine, admin review queue | Phase 1, 3 | 2–3 weeks | Workflow and UI can be built now; **[BLOCKED]** on real KYC provider selection for the actual verification calls (Phase 9 below). |
| 7 | Security hardening pass per [07](./07-security-architecture.md): CSP/security headers, encryption-at-rest for flagged fields, dependency/vuln scanning in CI, pen-test readiness review | Phase 1–6 | 1–2 weeks | No provider dependency. |
| 8 | **[BLOCKED] Real banking/payment provider integration**: implement `BankingProvider`/`PaymentProvider`/`AccountProvider`/`CardProvider` against the client's actual, contracted provider; webhook handling; reconciliation jobs | [09-client-requirements-and-credentials.md](./09-client-requirements-and-credentials.md) resolved | 3–8 weeks (highly provider-dependent — varies enormously between "one modern BaaS REST API" and "multiple legacy core-banking SOAP integrations") | Cannot be estimated precisely until the provider is named; ranges reflect that spread. |
| 9 | **[BLOCKED] Real KYC provider integration**: wire Phase 6's scaffolding to the actual verification vendor's API/webhooks | KYC provider selected | 1–2 weeks | Fast once the vendor is chosen, because the workflow scaffolding (Phase 6) is already built. |
| 10 | Fraud/risk provider integration (or documented interim rules-only policy) | Provider selected, or compliance sign-off on interim rules | 1–2 weeks | Can also proceed with velocity/amount-threshold rules only if the client defers a vendor decision — documented as an interim, not a permanent, policy. |
| 11 | Compliance content pass: replace every placeholder in [10-compliance-and-regulatory.md §1](./10-compliance-and-regulatory.md#1-unverifiedplaceholder-claims-currently-in-the-prototype) with legal-approved real copy or removes it | Client legal sign-off | 1 week engineering + however long legal review takes | Legal timeline is the client's, not engineering's, to estimate. |
| 12 | Staging UAT against provider sandbox, provider certification testing if required, security review/pen test | Phase 8–11 | 2–4 weeks | Duration heavily dependent on whether the chosen provider requires formal certification. |
| 13 | Production launch: secrets provisioned, monitoring/alerting live, backup/restore drill completed, admin accounts provisioned for real named staff | Phase 12 | 1 week | Go/no-go checklist, not new engineering. |

## Sequencing logic

Phases 1–7 (roughly 12–17 weeks) require **no decision from the client beyond approving this package** and produce a real backend, real auth, real RBAC, and a UI wired to real (currently fail-closed) provider calls instead of `setState`. This is deliberately front-loaded so engineering isn't idle waiting on provider contracts, and so the eventual provider integration (Phase 8) is "implement one interface" rather than "build the bank."

Phases 8–10 are the ones this brief explicitly says not to start coding yet, and they are the ones structurally gated on information only the client can provide (Phase 9/[09-client-requirements-and-credentials.md](./09-client-requirements-and-credentials.md)).

## What "done" looks like at the end of Phase 7, before any provider is connected

- A real customer can register, verify their email, log in with a real password + optional MFA, and see a dashboard that correctly shows "no accounts yet — verification pending" or equivalent, because there is no fake data left to show.
- An admin with the right scope can log in (with mandatory MFA) and see a real, empty (or sandbox-seeded, in staging) customer list, with every action they take audit-logged.
- Attempting a transfer produces a real `Transaction` row that reaches `PENDING_RISK_REVIEW` or fails closed with "transfers are not yet available" — never a fake "success."
- Nothing in the running application reads from `src/lib/mockData.ts`, because that file no longer exists in the app's import graph.

That state is itself a legitimate, honest product milestone to demo to the client or investors: a real bank's plumbing, correctly and visibly waiting for the one thing only the client can supply.

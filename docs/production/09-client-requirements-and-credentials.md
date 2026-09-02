# Phase 10 (deliverable 9) — Information and Credentials Required From the Client

Nothing in this list is guessed or assumed elsewhere in this package. Engineering is blocked on real financial functionality until the items marked **(blocking)** are provided.

## 1. Corporate/legal identity **(blocking for anything customer-facing)**

- Confirmed legal entity name and structure operating "Granger Bank" (or the real product name).
- Is the entity itself a chartered/licensed bank, or a technology company operating a program on top of a sponsor bank via a BaaS provider? This determines almost everything else in this list and in [10-compliance-and-regulatory.md](./10-compliance-and-regulatory.md).
- Jurisdiction(s) of operation and target customer jurisdiction(s) — determines which regulatory regime(s) apply (this document does not assume US/EU/other).
- Real registered business address, and confirmation of whether the product will represent itself as having physical branches (none exist today — confirm intent before any UI implies otherwise).

## 2. Banking/payment provider selection **(blocking for Phase 6/10 implementation)**

- Name of the chosen core banking platform, BaaS provider, and/or payment processor. Categories from [06-banking-provider-integration.md §4](./06-banking-provider-integration.md#4-what-phase-10-requires-before-any-real-implementation-is-written):
  - Core banking platform, or
  - Banking-as-a-Service provider, or
  - Payment processor, plus
  - Card issuing/processing provider (may be the same vendor or separate)
  - Account information / aggregation provider (may be included in the above)
- For each provider selected:
  - Signed commercial agreement / program agreement in place (engineering cannot integrate against a provider the client hasn't contracted with).
  - Sandbox/test environment credentials (`BANKING_API_URL`, `BANKING_API_KEY`, `BANKING_CLIENT_ID`, `BANKING_CLIENT_SECRET` or equivalent per that provider's actual auth scheme).
  - Full API documentation and webhook documentation (event types, payload shapes, signature verification method).
  - Rate limits, sandbox data reset behavior, and certification/testing requirements before production go-live (many providers require a certification test suite pass before issuing production credentials).
  - Named technical contact at the provider for integration support.

## 3. KYC / identity verification provider **(blocking for Phase 9 / customer onboarding)**

- Selected KYC/identity verification vendor (e.g. document verification + liveness + sanctions/watchlist screening).
- Sandbox credentials and documented decision states/webhooks.
- The client's defined risk policy: what KYC outcome is required before an account is `ACTIVE` vs. `RESTRICTED` vs. rejected — this is a business/compliance decision, not an engineering one; engineering implements the workflow, compliance defines the thresholds.

## 4. Fraud/risk provider (recommended before launch, not necessarily day one)

- Selected transaction/login risk-scoring vendor, if any, and sandbox credentials.
- If none is selected initially, confirm the interim risk policy (e.g. static velocity/amount rules only) that compliance is comfortable launching with.

## 5. Compliance/legal sign-off artifacts **(blocking for public claims — see [10](./10-compliance-and-regulatory.md))**

- Actual license numbers/regulatory registrations, if any, with verifiable documentation — not to be published on the site until legal confirms exact required wording.
- Deposit insurance membership (e.g. FDIC or jurisdiction equivalent) confirmation, if applicable — real certificate/membership number, not the placeholder "FDIC-style member protection" language currently in the prototype footer (`src/components/layout/Footer.tsx`), which must be corrected or removed before this is a real product.
- Any required regulatory disclosures, terms of service, privacy policy, e-sign consent language — drafted by the client's legal counsel, not authored by engineering.
- Data residency/retention requirements (where customer data may be stored, how long records must be retained).

## 6. Operational/organizational input

- Who holds each admin role in [07-security-architecture.md §8](./07-security-architecture.md#8-privilege-separation--admin-rbac) (Super Admin, Operations, Support, Compliance, Risk) — real named individuals/teams, for provisioning real accounts with real MFA enrollment, not the placeholder `admin@grangerbank.example` roster in the current mock data.
- Support contact channels that are actually staffed (phone number, chat) — the current UI shows a placeholder number (`1-800-555-0142`) and email domain (`grangerbank.example`) that must be replaced with real, monitored channels before launch.
- Expected launch scope: which account types, which transaction types (internal transfer only vs. external ACH/wire vs. card issuing) ship in v1 — affects which provider capabilities are actually needed for launch vs. later.

## 7. Infrastructure/hosting preference

- Preferred cloud provider (affects choice of managed Postgres, secret manager, and log/monitoring stack in [08-deployment-architecture.md](./08-deployment-architecture.md)) or confirmation that engineering should recommend one.
- Any existing SSO/identity provider the admin console should integrate with, if the client's internal staff already use one (e.g. Okta/Google Workspace) — simplifies admin authentication and can be layered onto the architecture in [04](./04-authentication-architecture.md).

## 8. Explicitly not the client's job to provide

For clarity, these are engineering's responsibility and are not blocked on the client: the Prisma schema, the provider abstraction interfaces, the security header configuration, the CI/CD pipeline, and the frontend component work. This list is deliberately narrow — only the things that are genuinely external facts (legal identity, contracted providers, compliance-approved language, named admins) that no amount of engineering effort can substitute for.

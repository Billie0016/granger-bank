# Granger Bank — Production Readiness Package

**Status:** Planning only. No application code has been modified to produce this package. Nothing in `src/` was touched.

## What this package is

This is the documentation deliverable requested before any production financial code is written:

1. [Current architecture audit](./01-current-architecture-audit.md)
2. [Production architecture](./02-production-architecture.md)
3. [Database schema](./03-database-schema.md)
4. [Authentication architecture](./04-authentication-architecture.md)
5. [Transaction architecture](./05-transaction-architecture.md)
6. [Banking provider integration architecture](./06-banking-provider-integration.md)
7. [Security architecture](./07-security-architecture.md)
8. [Deployment architecture](./08-deployment-architecture.md)
9. [Information/credentials required from the client](./09-client-requirements-and-credentials.md)
10. [Regulatory/compliance dependencies](./10-compliance-and-regulatory.md)
11. [Implementation phases and estimates](./11-implementation-phases.md)

## The single most important fact in this package

**The current Granger Bank build is a visual prototype with no backend.** Every balance, transaction, transfer, card, and admin record is a hardcoded array in one file (`src/lib/mockData.ts`). "Signing in" accepts any password and never checks it. There is no database, no API, no server-side code of any kind, and nothing that touches real money. This is appropriate for a design prototype and inappropriate for anything real — the rebuild described in this package treats that as the starting line, not a foundation to patch.

## The core architectural principle going forward

**Granger Bank's own systems will never be the source of truth for money.** The application will hold a local read model (cached balances, transaction history, statements) for speed and UX, but that model is always subordinate to, and reconciled against, whatever licensed banking/payment infrastructure the client is authorized to use. No code in this plan fabricates a transfer result, a balance change, or a KYC decision. Every one of those is a call to a named external provider interface — and until the client names that provider and supplies credentials, those interfaces are stubs that fail closed (they return "not configured," never a fake success).

## What this package deliberately does not do

- It does not implement the transaction/transfer/balance code. That is gated on your approval **and** on a named, authorized banking provider (Phase 10 in your brief).
- It does not claim Granger Bank is a licensed institution, insured, or partnered with any real bank. See [10-compliance-and-regulatory.md](./10-compliance-and-regulatory.md) for what must be true before any of that language is used publicly.
- It does not invent license numbers, addresses, executives, or SWIFT/BIC codes.

## How to use this package

Read documents 1–11 in order. Document 9 is the actionable one for the client's business side — it's the list of things (accounts, credentials, legal docs, provider contracts) that block engineering from writing a single line of real transaction code. Everything else is architecture that can proceed in parallel while that list is being worked.

# Phase 13 — Compliance Checklist (for the client's legal/regulatory team)

This document is a checklist to route to legal/compliance, and a record of unverified claims currently present in the visual prototype that must be resolved — corrected, substantiated with real documentation, or removed — before any public or production launch.

## 1. Unverified/placeholder claims currently in the prototype

These were written as design-prototype flavor text and **must not ship as-is.** Engineering has not verified any of the following and is not in a position to:

| Location | Current placeholder text | Required action |
|---|---|---|
| `src/components/layout/Footer.tsx` | "FDIC-style member protection · Demo institution" | Replace with real, legally-reviewed deposit insurance language **only if** actually a member of a real deposit insurance scheme, with the real membership identifier. Otherwise remove entirely. |
| `src/app/(site)/about/page.tsx` | Founding year (1998), "$41B+ assets," "180K+ clients," "28 yrs," timeline milestones | All fabricated for prototype flavor. Replace with real, verifiable figures the client can substantiate, or remove the stats section. |
| `src/app/(site)/contact/page.tsx`, `src/components/layout/Footer.tsx` | Address ("1 Granger Plaza, New York, NY 10005"), phone (`1-800-555-0142`), email domain (`grangerbank.example`) | Replace with real, staffed contact channels before launch. |
| Throughout | "Granger Bank" as a name | Confirm trademark clearance and that the name isn't already in use by a real regulated financial institution in the target jurisdiction(s). |
| Admin mock roster (`src/lib/mockData.ts` → removed in production) | Fictional admin names/emails | N/A once mock data is removed per [08-deployment-architecture.md §4](./08-deployment-architecture.md#4-preventing-demo-data--mock-providers-from-reaching-production) — flagged here only so nobody mistakes it for real staff. |

**Nothing above is currently presented as verified fact in this codebase** — it was built and labeled as a demo/prototype throughout (see the existing footer's own "Demo institution" and "fictional institution created for demonstration purposes only" copy). This section exists so that copy doesn't survive, unexamined, into a real launch.

## 2. Things this project will not do without your explicit, documented confirmation

Per your instructions, and restated here as a standing constraint on the whole engineering effort:

- **Will not claim Granger Bank is licensed or regulated** unless you provide verifiable license/registration documentation and legal-approved wording for how it's described.
- **Will not invent**: license numbers, regulatory approval statements, deposit insurance membership, physical branch locations, executive names/bios, business addresses, named "banking partners," or SWIFT/BIC codes. Every one of these, if used, comes from you, verified, in writing.
- **Will not fabricate KYC results.** Verification status (`KycRecord.status` in [03-database-schema.md](./03-database-schema.md)) is written only by the integration with a real KYC provider's response — never defaulted to "approved" for convenience, in any environment including staging (staging uses the provider's own sandbox decision logic, not a hardcoded pass).
- **Will not fabricate a transaction result.** Covered exhaustively in [05](./05-transaction-architecture.md) and [06](./06-banking-provider-integration.md) — this is a structural property of the code (fail-closed provider stubs), not just an intention.

## 3. Checklist for legal/regulatory review

- [ ] Confirm the legal entity's licensing status in every jurisdiction it will operate/market in (money transmitter license, banking charter, or "operates under a sponsor bank's charter via BaaS provider X" — get the exact correct framing from counsel).
- [ ] Confirm deposit insurance status and the exact permitted language, if any (e.g., pass-through FDIC insurance via a partner bank has specific, narrow permitted disclosure language in the US — do not paraphrase this without counsel review).
- [ ] Confirm required disclosures for the products offered: Regulation E (US) or equivalent electronic-transfer disclosure regime, Reg DD/truth-in-savings equivalent for account terms, Reg Z/truth-in-lending equivalent if lending products (the current prototype has a Loans marketing page — confirm whether real lending is in scope, which has its own, separate compliance track from deposit/transfer functionality).
- [ ] Confirm AML/BSA program requirements (or local equivalent): customer identification program, suspicious activity reporting process, OFAC/sanctions screening — and who is accountable for it (in-house compliance vs. the BaaS/bank partner's program, if operating under one).
- [ ] Confirm data protection regime(s) applicable (e.g. GDPR/CCPA/local equivalents) and required consent/disclosure language for the KYC document collection flow in [Phase 9](./03-database-schema.md#customer--kyc).
- [ ] Confirm record-retention requirements (commonly multi-year for financial transaction records) — this sets the backup/retention policy in [08-deployment-architecture.md §6](./08-deployment-architecture.md#6-backup-strategy--disaster-recovery), which currently states "confirm with legal" rather than assuming a number.
- [ ] Confirm marketing-copy review process so future homepage/product copy (APY figures, fee schedules, "same-day" transfer claims, card rewards claims) is legal-reviewed before publishing — several such figures exist as prototype flavor text today (e.g. "4.35% APY," "same-day ACH") and must be real, current, and accurate before launch, or removed.
- [ ] Confirm accessibility compliance requirements (e.g. WCAG level, ADA considerations) applicable to a public-facing financial service.

## 4. Ownership

This checklist is a starting point for the client's counsel, not a substitute for it. Engineering will implement whatever the compliance program requires (audit logging, disclosure timing, data retention, consent capture) once specified — engineering does not set regulatory policy.

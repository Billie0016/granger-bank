# Phase 4 (docs numbering) / Phase 4 in brief — Database Schema

## 1. Money representation rule

**Every monetary amount is stored as an integer count of the currency's minor unit (cents), never as `Float`/`Double`.** Prisma's `Decimal` type (backed by Postgres `NUMERIC`) is used for a small number of fields that require fractional precision beyond integer cents (e.g., FX rates); all balances, transaction amounts, and limits are `BigInt` minor-unit integers paired with an ISO 4217 `currency` column. This is enforced by schema convention (`AmountMinor BigInt`, `currency String @db.Char(3)`) and by a lint rule against `Float`/`Decimal` for anything named `*amount*` or `*balance*` in the money-handling packages.

## 2. Full schema (Prisma)

```prisma
// schema.prisma — production data model
// Postgres, accessed exclusively through Prisma. No raw SQL string concatenation.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------------------------
// IDENTITY & ACCESS
// ---------------------------------------------------------------------------

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  emailVerifiedAt   DateTime?
  phone             String?   @unique
  phoneVerifiedAt   DateTime?

  // Argon2id hash. Never plaintext, never reversible, never logged.
  passwordHash      String
  passwordUpdatedAt DateTime  @default(now())

  role              UserRole  @default(CUSTOMER)
  adminPermissions  AdminPermission[]   // only meaningful when role = ADMIN

  status            UserStatus @default(PENDING_VERIFICATION)

  mfaEnabled        Boolean   @default(false)
  mfaMethods        MfaMethod[]

  failedLoginCount  Int       @default(0)
  lockedUntil       DateTime?

  customerProfile   CustomerProfile?
  sessions          Session[]
  devices           Device[]
  securityEvents    SecurityEvent[]
  auditLogsActor    AuditLog[]        @relation("AuditActor")
  notifications     Notification[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([email])
  @@index([status])
}

enum UserRole {
  CUSTOMER
  ADMIN
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  CLOSED
}

// Fine-grained admin permissions — see Phase 8 (security/admin doc) for the
// full permission catalogue. Stored as a join so a Super Admin can grant
// exactly the permissions a role needs, not "all or nothing."
model AdminPermission {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scope     AdminScope
  grantedBy String   // User.id of the grantor — always an admin action, always audited
  grantedAt DateTime @default(now())

  @@unique([userId, scope])
}

enum AdminScope {
  CUSTOMERS_VIEW
  CUSTOMERS_MANAGE
  ACCOUNTS_VIEW
  ACCOUNTS_MANAGE
  TRANSACTIONS_VIEW
  TRANSFERS_APPROVE
  CARDS_MANAGE
  SUPPORT_RESPOND
  COMPLIANCE_REVIEW
  RISK_REVIEW
  AUDIT_LOG_VIEW
  SETTINGS_MANAGE
  ADMIN_MANAGE // grant/revoke other admins' permissions — Super Admin only in practice
}

model MfaMethod {
  id          String     @id @default(uuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        MfaType
  // TOTP secret is encrypted at rest (see security doc) — never stored plaintext.
  secretEnc   String?
  phoneNumber String?    // for SMS fallback, if offered
  verifiedAt  DateTime?
  createdAt   DateTime   @default(now())

  @@index([userId])
}

enum MfaType {
  TOTP
  SMS
  WEBAUTHN
}

model Session {
  id           String   @id @default(uuid()) // stored in an HttpOnly cookie; opaque to client
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceId     String?
  device       Device?  @relation(fields: [deviceId], references: [id])
  ipAddress    String
  userAgent    String
  createdAt    DateTime @default(now())
  lastSeenAt   DateTime @default(now())
  expiresAt    DateTime
  revokedAt    DateTime?
  revokedReason String?

  @@index([userId])
  @@index([expiresAt])
}

model Device {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  fingerprint   String    // derived, not raw client-supplied data alone
  name          String?   // "MacBook Pro · Chrome"
  trusted       Boolean   @default(false)
  firstSeenAt   DateTime  @default(now())
  lastSeenAt    DateTime  @default(now())
  sessions      Session[]

  @@unique([userId, fingerprint])
}

model SecurityEvent {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  type        SecurityEventType
  ipAddress   String
  userAgent   String?
  metadata    Json?    // structured context, never secrets
  riskScore   Int?     // from fraud/risk provider, if scored
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([type, createdAt])
}

enum SecurityEventType {
  LOGIN_SUCCESS
  LOGIN_FAILURE
  LOGIN_NEW_DEVICE
  LOGIN_IMPOSSIBLE_TRAVEL
  PASSWORD_CHANGED
  PASSWORD_RESET_REQUESTED
  MFA_ENABLED
  MFA_DISABLED
  MFA_CHALLENGE_FAILED
  ACCOUNT_LOCKED
  SESSION_REVOKED
}

// ---------------------------------------------------------------------------
// CUSTOMER / KYC
// ---------------------------------------------------------------------------

model CustomerProfile {
  id               String       @id @default(uuid())
  userId           String       @unique
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  legalFirstName   String
  legalLastName    String
  dateOfBirth      DateTime
  taxIdEnc         String?      // encrypted at rest (SSN/EIN equivalent)

  addressLine1     String
  addressLine2     String?
  city             String
  region           String
  postalCode       String
  country          String       @db.Char(2) // ISO 3166-1 alpha-2

  segment          CustomerSegment @default(PERSONAL)
  kyc              KycRecord?

  accounts         Account[]
  beneficiaries    Beneficiary[]

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}

enum CustomerSegment {
  PERSONAL
  PRIVATE
  BUSINESS
}

// KYC results are never invented locally — this table records the
// *provider's* verdict and a reference back to their case, per Phase 9.
model KycRecord {
  id                 String     @id @default(uuid())
  customerProfileId  String     @unique
  customerProfile    CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Cascade)

  status             KycStatus  @default(NOT_STARTED)
  provider           String?    // e.g. "persona", "onfido" — set once selected
  providerCaseId     String?    // the provider's case/reference id
  riskRating         RiskRating?
  documents          KycDocument[]

  submittedAt        DateTime?
  decidedAt          DateTime?
  expiresAt          DateTime?  // re-verification due date
  rejectionReason    String?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
}

enum KycStatus {
  NOT_STARTED
  PENDING
  IN_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum RiskRating {
  LOW
  MEDIUM
  HIGH
}

model KycDocument {
  id           String   @id @default(uuid())
  kycRecordId  String
  kycRecord    KycRecord @relation(fields: [kycRecordId], references: [id], onDelete: Cascade)
  type         KycDocumentType
  // Documents are stored with the KYC provider or in encrypted object storage
  // referenced by key — never inline in the database.
  storageRef   String
  status       KycDocumentStatus @default(PENDING)
  uploadedAt   DateTime @default(now())
  reviewedAt   DateTime?
}

enum KycDocumentType {
  GOVERNMENT_ID
  PROOF_OF_ADDRESS
  BUSINESS_REGISTRATION
  BENEFICIAL_OWNERSHIP
  SELFIE_LIVENESS
}

enum KycDocumentStatus {
  PENDING
  ACCEPTED
  REJECTED
}

// ---------------------------------------------------------------------------
// ACCOUNTS
// ---------------------------------------------------------------------------

model Account {
  id                 String       @id @default(uuid())
  customerProfileId  String
  customerProfile    CustomerProfile @relation(fields: [customerProfileId], references: [id])

  type               AccountType
  displayName        String
  currency           String       @db.Char(3) // ISO 4217, e.g. "USD"

  // The provider's identifier for this account — the actual account number/
  // IBAN lives with the provider; Granger Bank stores only a masked display
  // value and the provider's reference to look it up.
  providerAccountRef String       @unique
  maskedNumber       String       // e.g. "•••• 2481"

  status             AccountStatus @default(PENDING)

  // Cached read-model fields ONLY — always paired with cachedAt and always
  // reconciled against the provider before being trusted for anything
  // beyond display. See 06-banking-provider-integration.md.
  cachedBalanceMinor BigInt?
  cachedAvailableMinor BigInt?
  cachedAt           DateTime?

  beneficiaryOf      Beneficiary[]  @relation("BeneficiaryAccount")
  transactionsFrom   Transaction[]  @relation("SourceAccount")
  transactionsTo     Transaction[]  @relation("DestinationAccount")
  cards              Card[]
  statements         Statement[]

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([customerProfileId])
  @@index([providerAccountRef])
}

enum AccountType {
  CHECKING
  SAVINGS
  BUSINESS
}

enum AccountStatus {
  PENDING       // opened locally, awaiting provider confirmation
  ACTIVE
  RESTRICTED    // e.g. compliance hold
  CLOSED
}

model Beneficiary {
  id                 String   @id @default(uuid())
  customerProfileId  String
  customerProfile    CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Cascade)

  name               String
  relationship       String?
  bankName            String
  // External account details are stored only to the extent the provider's
  // transfer API requires them, and encrypted at rest.
  accountNumberEnc   String
  routingInfoEnc     String?  // routing/SWIFT/IBAN as applicable, encrypted

  linkedAccountId    String?
  linkedAccount      Account? @relation("BeneficiaryAccount", fields: [linkedAccountId], references: [id])

  status             BeneficiaryStatus @default(PENDING_VERIFICATION)
  transfers          Transaction[]

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([customerProfileId])
}

enum BeneficiaryStatus {
  PENDING_VERIFICATION
  VERIFIED
  BLOCKED
}

// ---------------------------------------------------------------------------
// TRANSACTIONS
// ---------------------------------------------------------------------------

// See 05-transaction-architecture.md for the full state machine and
// idempotency design this table supports.
model Transaction {
  id                  String   @id @default(uuid())
  idempotencyKey      String   @unique // client-supplied, enforced unique

  customerProfileId   String
  sourceAccountId     String?
  sourceAccount       Account? @relation("SourceAccount", fields: [sourceAccountId], references: [id])
  destinationAccountId String?
  destinationAccount  Account? @relation("DestinationAccount", fields: [destinationAccountId], references: [id])
  beneficiaryId       String?
  beneficiary         Beneficiary? @relation(fields: [beneficiaryId], references: [id])

  type                TransactionType
  direction           TransactionDirection
  amountMinor         BigInt
  currency            String   @db.Char(3)
  feeMinor            BigInt   @default(0)

  status              TransactionStatus @default(INITIATED)
  reference           String   // customer-facing reference/memo
  description         String?

  // Provider linkage — the actual settlement record of truth.
  provider            String?          // which provider handled this
  providerRequestId   String?          // sent to the provider (idempotency on their side too)
  providerTxnRef      String?          // the provider's transaction id, once known
  providerStatus      String?          // raw provider status, for reconciliation
  failureReason        String?

  riskScore           Int?
  riskFlags           Json?

  initiatedAt         DateTime @default(now())
  authorizedAt        DateTime?
  settledAt           DateTime?
  failedAt            DateTime?

  statusHistory       TransactionStatusEvent[]
  auditLogs           AuditLog[]

  @@index([customerProfileId, initiatedAt])
  @@index([status])
  @@index([providerTxnRef])
}

enum TransactionType {
  INTERNAL_TRANSFER   // between the customer's own accounts
  EXTERNAL_TRANSFER   // ACH / wire to a beneficiary
  CARD_PAYMENT
  DEPOSIT
  FEE
  INTEREST
  ADJUSTMENT          // admin-initiated correction — always dual-approved, always audited
}

enum TransactionDirection {
  DEBIT
  CREDIT
}

// Explicit state machine — see 05-transaction-architecture.md for allowed
// transitions. A transaction is never updated in place without a
// corresponding TransactionStatusEvent row.
enum TransactionStatus {
  INITIATED
  PENDING_RISK_REVIEW
  AUTHORIZED
  SUBMITTED_TO_PROVIDER
  SETTLED
  FAILED
  REJECTED
  REVERSED
}

model TransactionStatusEvent {
  id            String   @id @default(uuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  fromStatus    TransactionStatus?
  toStatus      TransactionStatus
  reason        String?
  actor         String   // "system", provider webhook id, or admin user id
  createdAt     DateTime @default(now())

  @@index([transactionId])
}

// ---------------------------------------------------------------------------
// CARDS
// ---------------------------------------------------------------------------

model Card {
  id                String     @id @default(uuid())
  accountId         String
  account           Account    @relation(fields: [accountId], references: [id])

  // The card issuing/processing provider owns the real PAN, CVV, and expiry.
  // Granger Bank stores only a display-safe reference and masked digits.
  providerCardRef   String     @unique
  last4             String
  network           String?    // provider-reported network, not invented
  type              CardType
  status            CardStatus @default(PENDING_ISSUANCE)

  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([accountId])
}

enum CardType {
  DEBIT
  CREDIT
  BUSINESS
}

enum CardStatus {
  PENDING_ISSUANCE
  ACTIVE
  FROZEN
  LOCKED
  CANCELLED
}

// ---------------------------------------------------------------------------
// STATEMENTS & NOTIFICATIONS
// ---------------------------------------------------------------------------

model Statement {
  id          String   @id @default(uuid())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
  periodStart DateTime
  periodEnd   DateTime
  // Generated PDF lives in encrypted object storage; this is a pointer.
  storageRef  String?
  status      StatementStatus @default(GENERATING)
  generatedAt DateTime?

  @@index([accountId, periodStart])
}

enum StatementStatus {
  GENERATING
  READY
  FAILED
}

model Notification {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type       String
  title      String
  body       String
  readAt     DateTime?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
}

// ---------------------------------------------------------------------------
// AUDIT
// ---------------------------------------------------------------------------

// One row per sensitive action, customer- or admin-initiated. Immutable —
// application code only ever INSERTs here, never UPDATE/DELETE. See
// 07-security-architecture.md for the enforcement mechanism (DB-level
// REVOKE UPDATE/DELETE for the app role).
model AuditLog {
  id            String   @id @default(uuid())
  actorUserId   String?
  actor         User?    @relation("AuditActor", fields: [actorUserId], references: [id])
  actorRole     UserRole?
  action        String   // e.g. "transfer.approved", "card.frozen", "admin.permission_granted"
  targetType    String   // e.g. "Transaction", "Customer", "Card"
  targetId      String
  transactionId String?
  transaction   Transaction? @relation(fields: [transactionId], references: [id])
  ipAddress     String?
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([actorUserId, createdAt])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

## 3. Notes on relationships, indexes, constraints

- **Every foreign key that represents ownership** (Account→CustomerProfile, Transaction→CustomerProfile, Card→Account) is indexed, because every service-layer read is filtered by it — this is how ownership checks stay fast at scale.
- **`Transaction.idempotencyKey` is globally unique** and is the enforcement point for "prevent duplicate transaction submission" (Phase 5) — a second request with the same key is rejected by the database's unique constraint even under a race, not just by an application-level check.
- **`AuditLog` and `TransactionStatusEvent` are append-only by convention and by database grant** (the application's Postgres role has no `UPDATE`/`DELETE` privilege on these tables — see [07-security-architecture.md](./07-security-architecture.md)).
- **PII fields that aren't needed in plaintext for a UI to function** (`taxIdEnc`, `accountNumberEnc`, MFA secrets) are suffixed `Enc` and encrypted at the application layer before insert, using a KMS-backed key — the database backup itself is not a sufficient PII boundary.
- **Nothing stores a raw card PAN, CVV, or provider API secret.** Card details live with the card issuing/processing provider; Granger Bank stores only `last4` and a provider reference, which is standard PCI-scope-reduction practice.

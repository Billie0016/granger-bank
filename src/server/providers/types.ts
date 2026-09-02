/**
 * Provider abstraction interfaces. See
 * docs/production/06-banking-provider-integration.md §2.
 *
 * Domain services (src/server/services/*) depend only on these interfaces,
 * never on a specific vendor SDK. Until a real, authorized provider is
 * configured (Phase 10 — requires the client to name and contract a
 * provider), every one of these resolves to an "unconfigured" implementation
 * that fails closed (src/server/providers/unconfigured.ts). No implementation
 * in this codebase fabricates a successful financial result.
 */

export type Money = { amountMinor: bigint; currency: string };

// ---------------------------------------------------------------------------
// AccountProvider — Account Information Services (read-side)
// ---------------------------------------------------------------------------

export interface ProviderBalance {
  availableMinor: bigint;
  ledgerMinor: bigint;
  currency: string;
  asOf: Date;
}

export interface ProviderTransaction {
  providerTxnRef: string;
  amountMinor: bigint;
  currency: string;
  direction: "DEBIT" | "CREDIT";
  description: string;
  postedAt: Date;
}

export interface AccountProvider {
  readonly name: string;
  getBalance(accountRef: string): Promise<ProviderBalance>;
  listTransactions(accountRef: string, range: { from: Date; to: Date }): Promise<ProviderTransaction[]>;
}

// ---------------------------------------------------------------------------
// BankingProvider — core banking / BaaS account lifecycle
// ---------------------------------------------------------------------------

export interface OpenAccountRequest {
  customerProfileId: string;
  accountType: "CHECKING" | "SAVINGS" | "BUSINESS";
  currency: string;
}

export interface ProviderAccountRef {
  providerAccountRef: string;
  maskedNumber: string;
}

export interface BankingProvider {
  readonly name: string;
  openAccount(request: OpenAccountRequest): Promise<ProviderAccountRef>;
  closeAccount(accountRef: string): Promise<void>;
  getAccountStatus(accountRef: string): Promise<"PENDING" | "ACTIVE" | "RESTRICTED" | "CLOSED">;
}

// ---------------------------------------------------------------------------
// PaymentProvider — movement of money
// ---------------------------------------------------------------------------

export interface SubmitTransferRequest {
  providerRequestId: string; // idempotency key passed through to the provider
  sourceAccountRef: string;
  destinationAccountRef?: string;
  destinationExternal?: { accountNumberEnc: string; routingInfoEnc?: string; bankName: string };
  amountMinor: bigint;
  currency: string;
  reference: string;
}

export interface SubmitTransferResult {
  providerTxnRef: string;
  status: string; // raw provider vocabulary — mapped to our TransactionStatus by the caller
}

export interface PaymentProvider {
  readonly name: string;
  submitTransfer(request: SubmitTransferRequest): Promise<SubmitTransferResult>;
  getTransferStatus(providerTxnRef: string): Promise<{ status: string; settledAt?: Date; failureReason?: string }>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
}

// ---------------------------------------------------------------------------
// TransactionProvider — provider-side transaction/settlement records
// (distinct from AccountProvider's read-only history: this covers
// provider-initiated events, e.g. incoming deposits, interest postings,
// chargebacks, that Granger Bank must ingest rather than having caused.)
// ---------------------------------------------------------------------------

export interface TransactionProvider {
  readonly name: string;
  listUnprocessedEvents(sinceCursor?: string): Promise<{ events: ProviderTransactionEvent[]; nextCursor?: string }>;
  acknowledgeEvent(eventId: string): Promise<void>;
}

export interface ProviderTransactionEvent {
  eventId: string;
  accountRef: string;
  providerTxnRef: string;
  type: "DEPOSIT" | "INTEREST" | "FEE" | "REVERSAL";
  amountMinor: bigint;
  currency: string;
  occurredAt: Date;
}

// ---------------------------------------------------------------------------
// CardProvider — card issuing/processing
// ---------------------------------------------------------------------------

export interface IssueCardRequest {
  accountRef: string;
  cardholderName: string;
  type: "DEBIT" | "CREDIT" | "BUSINESS";
}

export interface IssuedCard {
  providerCardRef: string;
  last4: string;
  network: string;
}

export interface CardProvider {
  readonly name: string;
  issueCard(request: IssueCardRequest): Promise<IssuedCard>;
  freezeCard(providerCardRef: string): Promise<void>;
  unfreezeCard(providerCardRef: string): Promise<void>;
  cancelCard(providerCardRef: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// KycProvider — identity verification (Phase 9)
// ---------------------------------------------------------------------------

export interface KycSubject {
  customerProfileId: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  country: string;
}

export interface KycVerificationResult {
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
  riskRating?: "LOW" | "MEDIUM" | "HIGH";
  reason?: string;
}

export interface KycProvider {
  readonly name: string;
  startVerification(subject: KycSubject): Promise<{ providerCaseId: string }>;
  getVerificationStatus(providerCaseId: string): Promise<KycVerificationResult>;
}

// ---------------------------------------------------------------------------
// FraudRiskProvider
// ---------------------------------------------------------------------------

export interface RiskScoringInput {
  customerProfileId: string;
  amountMinor: bigint;
  currency: string;
  destinationDescriptor: string;
  deviceFingerprint?: string;
}

export interface LoginRiskInput {
  userId: string;
  ipAddress: string;
  deviceFingerprint?: string;
  isNewDevice: boolean;
}

export interface RiskScoreResult {
  score: number; // 0 (no risk) - 100 (highest risk)
  flags: string[];
}

export interface FraudRiskProvider {
  readonly name: string;
  scoreTransaction(input: RiskScoringInput): Promise<RiskScoreResult>;
  scoreLogin(input: LoginRiskInput): Promise<RiskScoreResult>;
}

// ---------------------------------------------------------------------------
// EmailProvider — transactional email (verification, reset, notifications)
// ---------------------------------------------------------------------------

export interface EmailProvider {
  readonly name: string;
  send(message: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}

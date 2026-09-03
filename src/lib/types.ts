/**
 * Client-facing shapes returned by the internal API (src/app/api/**).
 * BigInt fields (amountMinor, balances) are serialized as strings by
 * serializeMoney() — see src/server/http/respond.ts — so they round-trip
 * through JSON without precision loss or floating-point math.
 */

export type Account = {
  id: string;
  type: "CHECKING" | "SAVINGS" | "BUSINESS";
  displayName: string;
  currency: string;
  status: "PENDING" | "ACTIVE" | "RESTRICTED" | "CLOSED";
  maskedNumber: string | null;
  cachedBalanceMinor: string | null;
  cachedAvailableMinor: string | null;
  cachedAt: string | null;
  internalLedgerBalanceMinor: string | null;
};

export type TransactionStatus =
  | "INITIATED"
  | "PENDING_RISK_REVIEW"
  | "AUTHORIZED"
  | "SUBMITTED_TO_PROVIDER"
  | "SETTLED"
  | "FAILED"
  | "REJECTED"
  | "REVERSED";

export type Transaction = {
  id: string;
  type: string;
  direction: "DEBIT" | "CREDIT";
  amountMinor: string;
  currency: string;
  status: TransactionStatus;
  reference: string;
  description: string | null;
  failureReason: string | null;
  initiatedAt: string;
  settledAt: string | null;
  sourceAccount?: Account | null;
  destinationAccount?: Account | null;
  beneficiary?: { id: string; name: string } | null;
};

export type Beneficiary = {
  id: string;
  name: string;
  relationship: string | null;
  bankName: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "BLOCKED";
  createdAt: string;
};

export type Card = {
  id: string;
  accountId: string;
  type: "DEBIT" | "CREDIT" | "BUSINESS";
  status: "PENDING_ISSUANCE" | "ACTIVE" | "FROZEN" | "LOCKED" | "CANCELLED";
  last4: string | null;
  network: string | null;
  account?: Account;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

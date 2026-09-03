import "server-only";
import { prisma } from "../db";
import { getAccountProvider } from "../providers/registry";
import { writeAuditLog } from "../security/audit";
import { ForbiddenError, NotFoundError } from "../security/errors";
import type { AccountType, UserRole } from "@prisma/client";

/**
 * Accounts are never a locally-authoritative balance. A new Account row
 * represents a customer's *request* to open an account (status PENDING,
 * no providerAccountRef, no balance) — it is provisioned for real only
 * once a BankingProvider is connected (Phase 10) and reflects a *cached*
 * balance only after a successful AccountProvider.getBalance() call.
 * See docs/production/05-transaction-architecture.md §5.
 */

export async function requestAccountOpening(params: {
  customerProfileId: string;
  type: AccountType;
  currency: string;
  displayName: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const account = await prisma.account.create({
    data: {
      customerProfileId: params.customerProfileId,
      type: params.type,
      currency: params.currency,
      displayName: params.displayName,
      status: "PENDING",
    },
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "account.opening_requested",
    targetType: "Account",
    targetId: account.id,
  });

  return account;
}

export async function listAccountsForCustomer(customerProfileId: string) {
  return prisma.account.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "asc" },
  });
}

/** Ownership check used by every other service before touching an account.
 * Never trusts a customerProfileId the client asserts about itself. */
export async function assertAccountOwnership(accountId: string, customerProfileId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new NotFoundError("Account not found.");
  if (account.customerProfileId !== customerProfileId) throw new ForbiddenError();
  return account;
}

/** Refreshes the cached balance from the provider. Fails closed
 * (ProviderNotConfiguredError, surfaced as-is to the caller) if no
 * provider is configured or the account hasn't been opened with one yet —
 * never falls back to fabricating a number. */
export async function syncAccountBalance(accountId: string) {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.providerAccountRef) {
    throw new NotFoundError("This account has not been provisioned with a banking provider yet.");
  }

  const provider = getAccountProvider();
  const balance = await provider.getBalance(account.providerAccountRef);

  return prisma.account.update({
    where: { id: accountId },
    data: {
      cachedBalanceMinor: balance.availableMinor,
      cachedAvailableMinor: balance.availableMinor,
      cachedAt: balance.asOf,
    },
  });
}

/**
 * Admin-only: opens an account for a customer that's immediately ACTIVE
 * and creditable, for demo/testing purposes. Deliberately distinct from
 * requestAccountOpening above, which creates the honest PENDING state a
 * real customer request sits in until a banking provider is connected —
 * this instead exists so an admin can give a customer with zero accounts
 * something to fund via createAdminAccountCredit (transactionService.ts)
 * right away, without waiting on a provider that doesn't exist in this
 * build. Writes its own distinct audit action so it's never confused with
 * a real customer-initiated request in the log.
 */
export async function adminOpenDemoAccount(params: {
  customerProfileId: string;
  type: AccountType;
  currency: string;
  displayName: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const profile = await prisma.customerProfile.findUnique({ where: { id: params.customerProfileId } });
  if (!profile) throw new NotFoundError("Customer not found.");

  const account = await prisma.account.create({
    data: {
      customerProfileId: params.customerProfileId,
      type: params.type,
      currency: params.currency,
      displayName: params.displayName,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "account.admin_demo_account_opened",
    targetType: "Account",
    targetId: account.id,
    metadata: { customerProfileId: params.customerProfileId, type: params.type, displayName: params.displayName },
  });

  return account;
}

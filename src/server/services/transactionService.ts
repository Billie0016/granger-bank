import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { getPaymentProvider, getFraudRiskProvider } from "../providers/registry";
import { ProviderNotConfiguredError } from "../security/errors";
import { writeAuditLog } from "../security/audit";
import { assertAccountOwnership } from "./accountService";
import { ForbiddenError, NotFoundError, ValidationError } from "../security/errors";
import type { TransactionStatus, UserRole } from "@prisma/client";

/**
 * Transfer orchestration implementing the state machine and idempotency
 * design in docs/production/05-transaction-architecture.md.
 *
 * This function NEVER writes to Account.cachedBalanceMinor as a side
 * effect of "success" — there is no success path here that isn't gated by
 * a real PaymentProvider, which is unconfigured in this build (per
 * explicit instruction). Every transfer attempted right now will
 * legitimately fail at the SUBMITTED_TO_PROVIDER step with a clear,
 * honest reason — that failure, fully recorded, IS the correct behavior,
 * not a bug to work around.
 */

export type CreateTransferInput = {
  idempotencyKey: string;
  customerProfileId: string;
  sourceAccountId: string;
  destinationAccountId?: string;
  beneficiaryId?: string;
  amountMinor: bigint;
  currency: string;
  reference: string;
  description?: string;
  actorUserId: string;
  actorRole: UserRole;
  ipAddress: string;
};

async function transitionStatus(transactionId: string, toStatus: TransactionStatus, reason: string | null, actor: string) {
  const current = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: toStatus,
        ...(toStatus === "AUTHORIZED" ? { authorizedAt: new Date() } : {}),
        ...(toStatus === "SETTLED" ? { settledAt: new Date() } : {}),
        ...(toStatus === "FAILED" ? { failedAt: new Date(), failureReason: reason ?? undefined } : {}),
      },
    }),
    prisma.transactionStatusEvent.create({
      data: { transactionId, fromStatus: current.status, toStatus, reason, actor },
    }),
  ]);
}

export async function createTransfer(input: CreateTransferInput) {
  if (!input.destinationAccountId && !input.beneficiaryId) {
    throw new ValidationError("A transfer must have either a destination account or a beneficiary.");
  }

  // --- Idempotency: a second request with the same key returns the first
  // request's transaction rather than creating a duplicate or erroring. ---
  const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  // --- Ownership checks (server-side, always) ---
  const sourceAccount = await assertAccountOwnership(input.sourceAccountId, input.customerProfileId);
  if (sourceAccount.status !== "ACTIVE") {
    throw new ValidationError("The source account is not active.");
  }

  if (input.destinationAccountId) {
    await assertAccountOwnership(input.destinationAccountId, input.customerProfileId);
  }

  let beneficiary = null;
  if (input.beneficiaryId) {
    beneficiary = await prisma.beneficiary.findUnique({ where: { id: input.beneficiaryId } });
    if (!beneficiary || beneficiary.customerProfileId !== input.customerProfileId) {
      throw new ForbiddenError();
    }
    if (beneficiary.status !== "VERIFIED") {
      throw new ValidationError(
        "This beneficiary has not completed verification yet and cannot receive transfers."
      );
    }
  }

  // --- Create the transaction record (INITIATED). Unique constraint on
  // idempotencyKey protects against a concurrent duplicate race. ---
  let transaction;
  try {
    transaction = await prisma.transaction.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        customerProfileId: input.customerProfileId,
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        beneficiaryId: input.beneficiaryId,
        type: input.destinationAccountId ? "INTERNAL_TRANSFER" : "EXTERNAL_TRANSFER",
        direction: "DEBIT",
        amountMinor: input.amountMinor,
        currency: input.currency,
        reference: input.reference,
        description: input.description,
        status: "INITIATED",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Lost the race to a concurrent identical request — return its result.
      const winner = await prisma.transaction.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (winner) return winner;
    }
    throw error;
  }

  await prisma.transactionStatusEvent.create({
    data: { transactionId: transaction.id, fromStatus: null, toStatus: "INITIATED", actor: "system" },
  });
  await writeAuditLog({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: "transaction.initiated",
    targetType: "Transaction",
    targetId: transaction.id,
    transactionId: transaction.id,
    ipAddress: input.ipAddress,
  });

  // --- Risk scoring (best-effort; a secondary, non-blocking provider) ---
  try {
    const risk = await getFraudRiskProvider().scoreTransaction({
      customerProfileId: input.customerProfileId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      destinationDescriptor: beneficiary?.name ?? input.destinationAccountId ?? "internal",
    });
    await prisma.transaction.update({ where: { id: transaction.id }, data: { riskScore: risk.score, riskFlags: risk.flags } });
    if (risk.score >= 80) {
      await transitionStatus(transaction.id, "PENDING_RISK_REVIEW", "risk_score_high", "system");
      return prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } });
    }
  } catch (error) {
    if (!(error instanceof ProviderNotConfiguredError)) throw error;
    // No fraud provider configured yet — this does not block the flow;
    // the payment provider call below is the actual gate on money moving.
  }

  await transitionStatus(transaction.id, "AUTHORIZED", null, "system");

  // --- Submit to the payment provider. This is the step that actually
  // moves money, and it is the step that is unconfigured in this build.
  // The failure here is not caught-and-hidden: it is recorded as the
  // transaction's real, final state. ---
  await transitionStatus(transaction.id, "SUBMITTED_TO_PROVIDER", null, "system");
  try {
    const provider = getPaymentProvider();
    const result = await provider.submitTransfer({
      providerRequestId: transaction.idempotencyKey,
      sourceAccountRef: sourceAccount.providerAccountRef ?? "",
      destinationAccountRef: input.destinationAccountId ?? undefined,
      amountMinor: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { provider: provider.name, providerTxnRef: result.providerTxnRef, providerStatus: result.status },
    });
    // A real provider integration maps its status vocabulary to SETTLED/
    // FAILED here, or (more commonly) waits for a webhook — see
    // docs/production/06-banking-provider-integration.md §1. Not reached
    // in this build.
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      await transitionStatus(
        transaction.id,
        "FAILED",
        "No payment provider is configured for this environment. This transfer was not submitted anywhere and no money moved.",
        "system"
      );
    } else {
      await transitionStatus(transaction.id, "FAILED", "Unexpected error submitting to payment provider.", "system");
      throw error;
    }
  }

  await writeAuditLog({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: "transaction.provider_submission_result",
    targetType: "Transaction",
    targetId: transaction.id,
    transactionId: transaction.id,
    ipAddress: input.ipAddress,
  });

  return prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } });
}

/** Admin action on a transaction held in PENDING_RISK_REVIEW. Moving it to
 * AUTHORIZED still does not move any money — the next step is the same
 * fail-closed PaymentProvider submission every transfer goes through. See
 * docs/production/07-security-architecture.md §8 (TRANSFERS_APPROVE scope). */
export async function adminReviewTransaction(params: {
  transactionId: string;
  decision: "APPROVE" | "REJECT";
  actorUserId: string;
  actorRole: UserRole;
  reason?: string;
}) {
  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: params.transactionId } });
  if (transaction.status !== "PENDING_RISK_REVIEW") {
    throw new ValidationError("Only transactions pending risk review can be approved or rejected here.");
  }

  await transitionStatus(
    params.transactionId,
    params.decision === "APPROVE" ? "AUTHORIZED" : "REJECTED",
    params.reason ?? null,
    params.actorUserId
  );

  await writeAuditLog({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: params.decision === "APPROVE" ? "transaction.risk_approved" : "transaction.risk_rejected",
    targetType: "Transaction",
    targetId: params.transactionId,
    transactionId: params.transactionId,
    metadata: { reason: params.reason },
  });

  return prisma.transaction.findUniqueOrThrow({ where: { id: params.transactionId } });
}

export async function listTransactionsForCustomer(customerProfileId: string, limit = 50) {
  return prisma.transaction.findMany({
    where: { customerProfileId },
    orderBy: { initiatedAt: "desc" },
    take: limit,
    include: { sourceAccount: true, destinationAccount: true, beneficiary: true },
  });
}

export async function getTransactionForCustomer(transactionId: string, customerProfileId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!transaction) throw new NotFoundError("Transaction not found.");
  if (transaction.customerProfileId !== customerProfileId) throw new ForbiddenError();
  return transaction;
}

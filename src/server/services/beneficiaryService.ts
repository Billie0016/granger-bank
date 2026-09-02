import "server-only";
import { prisma } from "../db";
import { encryptField } from "../security/encryption";
import { writeAuditLog } from "../security/audit";
import { ForbiddenError, NotFoundError } from "../security/errors";
import type { UserRole } from "@prisma/client";

/**
 * Beneficiaries are real database records (no provider needed just to save
 * a payee's details) — but they are created PENDING_VERIFICATION and stay
 * that way, honestly, until a real verification step exists. A beneficiary
 * can never be transferred to (see transactionService.createTransfer) while
 * unverified, which is what makes this safe to build ahead of Phase 10.
 */

export async function listBeneficiariesForCustomer(customerProfileId: string) {
  return prisma.beneficiary.findMany({ where: { customerProfileId }, orderBy: { createdAt: "desc" } });
}

export async function addBeneficiary(params: {
  customerProfileId: string;
  name: string;
  relationship?: string;
  bankName: string;
  accountNumber: string;
  routingInfo?: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const beneficiary = await prisma.beneficiary.create({
    data: {
      customerProfileId: params.customerProfileId,
      name: params.name,
      relationship: params.relationship,
      bankName: params.bankName,
      accountNumberEnc: encryptField(params.accountNumber),
      routingInfoEnc: params.routingInfo ? encryptField(params.routingInfo) : undefined,
      status: "PENDING_VERIFICATION",
    },
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "beneficiary.added",
    targetType: "Beneficiary",
    targetId: beneficiary.id,
  });

  // Never return accountNumberEnc/routingInfoEnc to the caller — the API
  // layer additionally strips these before serializing (defense in depth).
  return beneficiary;
}

export async function removeBeneficiary(beneficiaryId: string, customerProfileId: string, actorUserId: string, actorRole: UserRole) {
  const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } });
  if (!beneficiary) throw new NotFoundError("Beneficiary not found.");
  if (beneficiary.customerProfileId !== customerProfileId) throw new ForbiddenError();

  await prisma.beneficiary.delete({ where: { id: beneficiaryId } });
  await writeAuditLog({
    actorUserId,
    actorRole,
    action: "beneficiary.removed",
    targetType: "Beneficiary",
    targetId: beneficiaryId,
  });
}

/** Strips encrypted fields before a Beneficiary is ever serialized to a
 * client — the API never returns account/routing details back out, even
 * encrypted, once they're in. */
export function toPublicBeneficiary<T extends { accountNumberEnc: string; routingInfoEnc: string | null }>(
  beneficiary: T
) {
  const { accountNumberEnc: _a, routingInfoEnc: _r, ...rest } = beneficiary;
  return rest;
}

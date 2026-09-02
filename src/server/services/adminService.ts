import "server-only";
import { prisma } from "../db";
import { grantScopes, revokeScopes } from "../auth/rbac";
import { writeAuditLog } from "../security/audit";
import { NotFoundError, ValidationError } from "../security/errors";
import type { AdminScope, UserRole } from "@prisma/client";

/**
 * Admin-facing operations. Every mutating function here writes an
 * AuditLog row — see docs/production/07-security-architecture.md §8
 * ("every sensitive administrative action must create an audit record").
 */

export async function listCustomers(params: { search?: string; limit?: number }) {
  return prisma.customerProfile.findMany({
    where: params.search
      ? {
          OR: [
            { legalFirstName: { contains: params.search, mode: "insensitive" } },
            { legalLastName: { contains: params.search, mode: "insensitive" } },
            { user: { email: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { user: { select: { email: true, status: true, createdAt: true } }, kyc: true },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
  });
}

export async function getCustomerDetail(customerProfileId: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    include: {
      user: { select: { email: true, status: true, mfaEnabled: true, createdAt: true } },
      kyc: true,
      accounts: true,
    },
  });
  if (!profile) throw new NotFoundError("Customer not found.");
  return profile;
}

export async function listAllAccounts(params: { limit?: number }) {
  return prisma.account.findMany({
    include: { customerProfile: { select: { legalFirstName: true, legalLastName: true } } },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 200,
  });
}

export async function listAllCards(params: { limit?: number }) {
  return prisma.card.findMany({
    include: { account: { include: { customerProfile: { select: { legalFirstName: true, legalLastName: true } } } } },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 200,
  });
}

export async function listAllTransactions(params: { limit?: number; status?: string }) {
  return prisma.transaction.findMany({
    where: params.status ? { status: params.status as never } : undefined,
    include: { customerProfile: { select: { legalFirstName: true, legalLastName: true } } },
    orderBy: { initiatedAt: "desc" },
    take: params.limit ?? 100,
  });
}

export async function listAuditLogs(params: { limit?: number; targetType?: string }) {
  return prisma.auditLog.findMany({
    where: params.targetType ? { targetType: params.targetType } : undefined,
    include: { actor: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 200,
  });
}

/** Grants admin scopes. Requires ADMIN_MANAGE on the grantor, enforced by
 * the calling route handler via requireAdminScope — this function assumes
 * that check already happened and focuses on the data change + audit. */
export async function grantAdminScopes(params: {
  targetUserId: string;
  scopes: AdminScope[];
  grantedById: string;
}) {
  const target = await prisma.user.findUnique({ where: { id: params.targetUserId } });
  if (!target) throw new NotFoundError("User not found.");
  if (target.role !== "ADMIN") {
    throw new ValidationError("Scopes can only be granted to admin users. Promote the user to ADMIN first.");
  }

  await grantScopes({ userId: params.targetUserId, scopes: params.scopes, grantedById: params.grantedById });

  await writeAuditLog({
    actorUserId: params.grantedById,
    actorRole: "ADMIN",
    action: "admin.permission_granted",
    targetType: "User",
    targetId: params.targetUserId,
    metadata: { scopes: params.scopes },
  });
}

export async function revokeAdminScopes(params: { targetUserId: string; scopes: AdminScope[]; revokedById: string }) {
  await revokeScopes({ userId: params.targetUserId, scopes: params.scopes });

  await writeAuditLog({
    actorUserId: params.revokedById,
    actorRole: "ADMIN" as UserRole,
    action: "admin.permission_revoked",
    targetType: "User",
    targetId: params.targetUserId,
    metadata: { scopes: params.scopes },
  });
}

export async function setCustomerStatus(params: {
  customerUserId: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  actorUserId: string;
  reason: string;
}) {
  const updated = await prisma.user.update({ where: { id: params.customerUserId }, data: { status: params.status } });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    actorRole: "ADMIN",
    action: "customer.status_changed",
    targetType: "User",
    targetId: params.customerUserId,
    metadata: { newStatus: params.status, reason: params.reason },
  });

  return updated;
}

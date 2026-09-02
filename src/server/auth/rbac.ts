import "server-only";
import { prisma } from "../db";
import type { AdminScope } from "@prisma/client";

/**
 * Role-based access control for the admin console. See
 * docs/production/07-security-architecture.md §8.
 *
 * The source of truth for what an admin can do is always their individual
 * AdminPermission rows (checked in hasScope/requireScope), never a role
 * name. ADMIN_ROLE_BUNDLES below is only a convenience default used when
 * *provisioning* a new admin — changing it does not retroactively change
 * any existing admin's actual permissions.
 */

export const ADMIN_ROLE_BUNDLES = {
  SUPER_ADMIN: [
    "CUSTOMERS_VIEW",
    "CUSTOMERS_MANAGE",
    "ACCOUNTS_VIEW",
    "ACCOUNTS_MANAGE",
    "TRANSACTIONS_VIEW",
    "TRANSFERS_APPROVE",
    "CARDS_MANAGE",
    "SUPPORT_RESPOND",
    "COMPLIANCE_REVIEW",
    "RISK_REVIEW",
    "AUDIT_LOG_VIEW",
    "SETTINGS_MANAGE",
    "ADMIN_MANAGE",
  ],
  OPERATIONS: ["ACCOUNTS_VIEW", "ACCOUNTS_MANAGE", "CARDS_MANAGE", "TRANSACTIONS_VIEW"],
  CUSTOMER_SUPPORT: ["CUSTOMERS_VIEW", "SUPPORT_RESPOND", "TRANSACTIONS_VIEW"],
  COMPLIANCE: ["COMPLIANCE_REVIEW", "AUDIT_LOG_VIEW", "CUSTOMERS_VIEW"],
  RISK_FRAUD: ["RISK_REVIEW", "TRANSFERS_APPROVE", "AUDIT_LOG_VIEW"],
} as const satisfies Record<string, readonly AdminScope[]>;

export type AdminRoleBundle = keyof typeof ADMIN_ROLE_BUNDLES;

export async function getEffectiveScopes(userId: string): Promise<AdminScope[]> {
  const rows = await prisma.adminPermission.findMany({
    where: { userId, revokedAt: null },
    select: { scope: true },
  });
  return rows.map((r) => r.scope);
}

export async function hasScope(userId: string, scope: AdminScope): Promise<boolean> {
  const match = await prisma.adminPermission.findFirst({
    where: { userId, scope, revokedAt: null },
  });
  return !!match;
}

/** Grants scopes to a user, recording who granted them. Every call site
 * must independently write an AuditLog entry for the grant — this function
 * only performs the data change, matching the pattern in
 * src/server/security/audit.ts of keeping audit writes explicit and
 * reviewable at each call site. */
export async function grantScopes(params: { userId: string; scopes: AdminScope[]; grantedById: string }) {
  await prisma.$transaction(
    params.scopes.map((scope) =>
      prisma.adminPermission.upsert({
        where: { userId_scope: { userId: params.userId, scope } },
        create: { userId: params.userId, scope, grantedById: params.grantedById },
        update: { revokedAt: null, grantedById: params.grantedById, grantedAt: new Date() },
      })
    )
  );
}

export async function revokeScopes(params: { userId: string; scopes: AdminScope[] }) {
  await prisma.adminPermission.updateMany({
    where: { userId: params.userId, scope: { in: params.scopes } },
    data: { revokedAt: new Date() },
  });
}

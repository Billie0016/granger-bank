import "server-only";
import { prisma } from "../db";
import type { UserRole } from "@prisma/client";

/**
 * Every sensitive action — customer or admin — writes exactly one row here.
 * This is the only function in the codebase that should insert into
 * AuditLog, so every call site is easy to audit in code review. The
 * database grant that makes this table append-only (no UPDATE/DELETE for
 * the app's runtime role) is applied in the deployment migration —
 * see docs/production/07-security-architecture.md §7.
 */
export async function writeAuditLog(entry: {
  actorUserId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  targetType: string;
  targetId: string;
  transactionId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      transactionId: entry.transactionId ?? null,
      ipAddress: entry.ipAddress ?? null,
      metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
    },
  });
}

/** Security-relevant events distinct from admin/business audit actions —
 * login attempts, MFA challenges, lockouts. Feeds suspicious-activity
 * detection (docs/production/04-authentication-architecture.md §7). */
export async function recordSecurityEvent(entry: {
  userId?: string | null;
  type:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILURE"
    | "LOGIN_NEW_DEVICE"
    | "LOGIN_IMPOSSIBLE_TRAVEL"
    | "PASSWORD_CHANGED"
    | "PASSWORD_RESET_REQUESTED"
    | "PASSWORD_RESET_COMPLETED"
    | "MFA_ENABLED"
    | "MFA_DISABLED"
    | "MFA_CHALLENGE_FAILED"
    | "MFA_CHALLENGE_SUCCESS"
    | "ACCOUNT_LOCKED"
    | "ACCOUNT_UNLOCKED"
    | "SESSION_REVOKED"
    | "RATE_LIMIT_EXCEEDED"
    | "CSRF_REJECTED";
  ipAddress: string;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  riskScore?: number | null;
}) {
  await prisma.securityEvent.create({
    data: {
      userId: entry.userId ?? null,
      type: entry.type,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent ?? null,
      metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
      riskScore: entry.riskScore ?? null,
    },
  });
}

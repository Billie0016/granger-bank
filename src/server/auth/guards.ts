import "server-only";
import { getAuthContext, type AuthContext } from "./session";
import { hasScope } from "./rbac";
import { ForbiddenError, UnauthenticatedError } from "../security/errors";
import type { AdminScope, UserRole } from "@prisma/client";

/** Every protected route handler starts with this. Throws 401 if there is
 * no valid session — never infers identity from anything the client sent
 * other than the HttpOnly session cookie. If the user has MFA enabled, the
 * session must also have completed that challenge (mfaVerifiedAt set) —
 * a password-only session for an MFA-enrolled user is not sufficient. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new UnauthenticatedError();
  if (ctx.user.mfaEnabled && !ctx.session.mfaVerifiedAt) {
    throw new ForbiddenError("MFA_REQUIRED");
  }
  return ctx;
}

export async function requireRole(role: UserRole): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.user.role !== role) throw new ForbiddenError();
  return ctx;
}

/** Admin routes additionally require the session to have completed an MFA
 * challenge (docs/production/07-security-architecture.md §9) — a session
 * that authenticated with password only is not sufficient to reach any
 * admin-scoped action, even for a Super Admin. */
export async function requireAdminScope(scope: AdminScope): Promise<AuthContext> {
  const ctx = await requireRole("ADMIN");

  if (!ctx.user.mfaEnabled || !ctx.session.mfaVerifiedAt) {
    throw new ForbiddenError("Admin access requires multi-factor authentication.");
  }

  const allowed = await hasScope(ctx.user.id, scope);
  if (!allowed) throw new ForbiddenError();

  return ctx;
}

/** Extracts a best-effort client IP for rate limiting / audit / security
 * events. Trusts X-Forwarded-For only because the deployment target sits
 * behind a load balancer/CDN that sets it — see
 * docs/production/08-deployment-architecture.md. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

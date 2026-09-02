import { z } from "zod";
import { parseJsonBody, uuidSchema } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAdminScope } from "@/server/auth/guards";
import { grantAdminScopes, revokeAdminScopes } from "@/server/services/adminService";

const ADMIN_SCOPES = [
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
] as const;

const schema = z.object({
  targetUserId: uuidSchema,
  scopes: z.array(z.enum(ADMIN_SCOPES)).min(1),
});

/** Granting/revoking admin permissions is itself gated on ADMIN_MANAGE —
 * the most sensitive scope in the system — and is always audited. See
 * docs/production/07-security-architecture.md §8. */
export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAdminScope("ADMIN_MANAGE");
  const { targetUserId, scopes } = await parseJsonBody(request, schema);

  await grantAdminScopes({ targetUserId, scopes, grantedById: ctx.user.id });
  return jsonOk({ ok: true });
});

export const DELETE = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAdminScope("ADMIN_MANAGE");
  const { targetUserId, scopes } = await parseJsonBody(request, schema);

  await revokeAdminScopes({ targetUserId, scopes, revokedById: ctx.user.id });
  return jsonOk({ ok: true });
});

import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { getAuthContext, revokeSession, clearSessionCookie } from "@/server/auth/session";
import { recordSecurityEvent } from "@/server/security/audit";
import { getClientIp } from "@/server/auth/guards";

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);

  const ctx = await getAuthContext();
  if (ctx) {
    await revokeSession(ctx.session.id, "user_logout");
    await recordSecurityEvent({ userId: ctx.user.id, type: "SESSION_REVOKED", ipAddress: getClientIp(request) });
  }
  await clearSessionCookie();

  return jsonOk({ ok: true });
});

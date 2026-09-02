import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { confirmTotpEnrollment, generateRecoveryCodes } from "@/server/auth/mfa";
import { markSessionMfaVerified } from "@/server/auth/session";
import { recordSecurityEvent } from "@/server/security/audit";
import { getClientIp } from "@/server/auth/guards";
import { ValidationError } from "@/server/security/errors";

const schema = z.object({ methodId: z.string().uuid(), code: z.string().min(6).max(10) });

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();

  const { methodId, code } = await parseJsonBody(request, schema);
  const confirmed = await confirmTotpEnrollment(ctx.user.id, methodId, code);
  if (!confirmed) throw new ValidationError("Invalid verification code.");

  const recoveryCodes = await generateRecoveryCodes(ctx.user.id);
  await markSessionMfaVerified(ctx.session.id);
  await recordSecurityEvent({ userId: ctx.user.id, type: "MFA_ENABLED", ipAddress: getClientIp(request) });

  return jsonOk({ ok: true, recoveryCodes });
});

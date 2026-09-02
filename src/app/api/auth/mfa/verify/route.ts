import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { getAuthContext, markSessionMfaVerified } from "@/server/auth/session";
import { verifyTotpForUser, consumeRecoveryCode } from "@/server/auth/mfa";
import { enforceRateLimit } from "@/server/security/rateLimiter";
import { getClientIp } from "@/server/auth/guards";
import { recordSecurityEvent } from "@/server/security/audit";
import { UnauthenticatedError, ValidationError } from "@/server/security/errors";

const schema = z.object({
  code: z.string().min(6).max(20),
  isRecoveryCode: z.boolean().optional(),
});

/**
 * Step-up MFA challenge, called right after a password-only login when
 * /api/auth/login responded with mfaRequired: true. Deliberately uses
 * getAuthContext() directly rather than requireAuth() — requireAuth()
 * would reject this exact session for not having completed MFA yet, which
 * is precisely the state this endpoint exists to resolve.
 */
export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);

  const ctx = await getAuthContext();
  if (!ctx) throw new UnauthenticatedError();

  const ip = getClientIp(request);
  await enforceRateLimit({ key: `mfa:${ctx.user.id}`, limit: 8, windowSeconds: 15 * 60, ipAddress: ip, userId: ctx.user.id });

  const { code, isRecoveryCode } = await parseJsonBody(request, schema);

  const valid = isRecoveryCode
    ? await consumeRecoveryCode(ctx.user.id, code)
    : await verifyTotpForUser(ctx.user.id, code);

  if (!valid) {
    await recordSecurityEvent({ userId: ctx.user.id, type: "MFA_CHALLENGE_FAILED", ipAddress: ip });
    throw new ValidationError("Invalid verification code.");
  }

  await markSessionMfaVerified(ctx.session.id);
  await recordSecurityEvent({ userId: ctx.user.id, type: "MFA_CHALLENGE_SUCCESS", ipAddress: ip });

  return jsonOk({ ok: true });
});

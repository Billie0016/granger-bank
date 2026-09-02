import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth, getClientIp } from "@/server/auth/guards";
import { disableMfa } from "@/server/auth/mfa";
import { verifyPassword } from "@/server/auth/passwords";
import { recordSecurityEvent } from "@/server/security/audit";
import { prisma } from "@/server/db";
import { ValidationError } from "@/server/security/errors";

const schema = z.object({ password: z.string().min(1) });

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();

  const { password } = await parseJsonBody(request, schema);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) throw new ValidationError("Incorrect password.");

  await disableMfa(ctx.user.id);
  await recordSecurityEvent({ userId: ctx.user.id, type: "MFA_DISABLED", ipAddress: getClientIp(request) });

  return jsonOk({ ok: true });
});

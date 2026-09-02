import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { revokeSession } from "@/server/auth/session";
import { recordSecurityEvent } from "@/server/security/audit";
import { getClientIp } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { ForbiddenError, NotFoundError } from "@/server/security/errors";

export const DELETE = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAuth();
    const { id } = await params;

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundError("Session not found.");
    if (session.userId !== ctx.user.id) throw new ForbiddenError();

    await revokeSession(id, "user_revoked_device");
    await recordSecurityEvent({ userId: ctx.user.id, type: "SESSION_REVOKED", ipAddress: getClientIp(request) });

    return jsonOk({ ok: true });
  }
);

import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { markNotificationRead } from "@/server/services/notificationService";

export const POST = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAuth();
    const { id } = await params;

    const notification = await markNotificationRead(id, ctx.user.id);
    return jsonOk({ notification });
  }
);

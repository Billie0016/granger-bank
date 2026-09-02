import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { markAllNotificationsRead } from "@/server/services/notificationService";

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();
  await markAllNotificationsRead(ctx.user.id);
  return jsonOk({ ok: true });
});

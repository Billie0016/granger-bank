import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAuth } from "@/server/auth/guards";
import { listNotifications } from "@/server/services/notificationService";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const notifications = await listNotifications(ctx.user.id);
  return jsonOk({ notifications });
});

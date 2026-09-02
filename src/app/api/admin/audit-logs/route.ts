import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { listAuditLogs } from "@/server/services/adminService";

export const GET = withErrorHandling(async (request: Request) => {
  await requireAdminScope("AUDIT_LOG_VIEW");

  const url = new URL(request.url);
  const targetType = url.searchParams.get("targetType") ?? undefined;

  const logs = await listAuditLogs({ targetType });
  return jsonOk({ logs });
});

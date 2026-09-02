import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { listAllAccounts } from "@/server/services/adminService";

export const GET = withErrorHandling(async () => {
  await requireAdminScope("ACCOUNTS_VIEW");
  const accounts = await listAllAccounts({});
  return jsonOk(serializeMoney({ accounts }));
});

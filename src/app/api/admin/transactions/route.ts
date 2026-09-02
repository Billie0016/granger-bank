import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { listAllTransactions } from "@/server/services/adminService";

export const GET = withErrorHandling(async (request: Request) => {
  await requireAdminScope("TRANSACTIONS_VIEW");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;

  const transactions = await listAllTransactions({ status });
  return jsonOk(serializeMoney({ transactions }));
});

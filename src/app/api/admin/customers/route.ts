import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { listCustomers } from "@/server/services/adminService";

export const GET = withErrorHandling(async (request: Request) => {
  await requireAdminScope("CUSTOMERS_VIEW");

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;

  const customers = await listCustomers({ search });
  return jsonOk({ customers });
});

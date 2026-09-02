import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { listAllCards } from "@/server/services/adminService";

export const GET = withErrorHandling(async () => {
  await requireAdminScope("CARDS_MANAGE");
  const cards = await listAllCards({});
  return jsonOk({ cards });
});

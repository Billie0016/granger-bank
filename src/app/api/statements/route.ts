import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAuth } from "@/server/auth/guards";
import { listStatementsForCustomer } from "@/server/services/statementService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const statements = await listStatementsForCustomer(profile.id);
  return jsonOk({ statements });
});

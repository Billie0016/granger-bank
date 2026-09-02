import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { assertAccountOwnership, syncAccountBalance } from "@/server/services/accountService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

/**
 * Refreshes an account's cached balance from AccountProvider. Fails closed
 * (503) until a real provider is configured — see
 * src/server/services/accountService.ts and
 * docs/production/06-banking-provider-integration.md.
 */
export const POST = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAuth();
    const profile = await getCustomerProfileByUserId(ctx.user.id);
    const { id } = await params;

    await assertAccountOwnership(id, profile.id);
    const account = await syncAccountBalance(id);

    return jsonOk(serializeMoney({ account }));
  }
);

import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { startVerification } from "@/server/services/kycService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

/**
 * Fails closed (503) until a real KYC provider is configured — see
 * src/server/services/kycService.ts and docs/production/09-...
 * §3 (KYC provider selection is a client-supplied prerequisite).
 */
export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);

  const kyc = await startVerification(profile.id, ctx.user.id, ctx.user.role);
  return jsonOk({ kyc });
});

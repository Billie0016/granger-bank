import { z } from "zod";
import { parseJsonBody, currencySchema } from "@/server/security/validation";
import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { requestAccountOpening, listAccountsForCustomer } from "@/server/services/accountService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const accounts = await listAccountsForCustomer(profile.id);
  return jsonOk(serializeMoney({ accounts }));
});

const openAccountSchema = z.object({
  type: z.enum(["CHECKING", "SAVINGS", "BUSINESS"]),
  currency: currencySchema,
  displayName: z.string().trim().min(1).max(100),
});

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const input = await parseJsonBody(request, openAccountSchema);

  const account = await requestAccountOpening({
    customerProfileId: profile.id,
    type: input.type,
    currency: input.currency,
    displayName: input.displayName,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
  });

  return jsonOk(serializeMoney({ account }), 201);
});

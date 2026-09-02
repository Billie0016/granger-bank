import { z } from "zod";
import { parseJsonBody, uuidSchema } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { listCardsForCustomer, requestCardIssuance } from "@/server/services/cardService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const cards = await listCardsForCustomer(profile.id);
  return jsonOk({ cards });
});

const requestCardSchema = z.object({
  accountId: uuidSchema,
  type: z.enum(["DEBIT", "CREDIT", "BUSINESS"]),
});

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const input = await parseJsonBody(request, requestCardSchema);

  const card = await requestCardIssuance({
    ...input,
    customerProfileId: profile.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
  });

  return jsonOk({ card }, 201);
});

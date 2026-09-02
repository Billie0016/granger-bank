import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { addBeneficiary, listBeneficiariesForCustomer, toPublicBeneficiary } from "@/server/services/beneficiaryService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const beneficiaries = await listBeneficiariesForCustomer(profile.id);
  return jsonOk({ beneficiaries: beneficiaries.map(toPublicBeneficiary) });
});

const addBeneficiarySchema = z.object({
  name: z.string().trim().min(1).max(140),
  relationship: z.string().trim().max(60).optional(),
  bankName: z.string().trim().min(1).max(140),
  accountNumber: z.string().trim().min(4).max(40),
  routingInfo: z.string().trim().max(40).optional(),
});

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const input = await parseJsonBody(request, addBeneficiarySchema);

  const beneficiary = await addBeneficiary({
    ...input,
    customerProfileId: profile.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
  });

  return jsonOk({ beneficiary: toPublicBeneficiary(beneficiary) }, 201);
});

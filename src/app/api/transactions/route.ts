import { z } from "zod";
import { parseJsonBody, amountMinorSchema, currencySchema, uuidSchema } from "@/server/security/validation";
import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth, getClientIp } from "@/server/auth/guards";
import { enforceRateLimit } from "@/server/security/rateLimiter";
import { createTransfer, listTransactionsForCustomer } from "@/server/services/transactionService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";
import { ValidationError } from "@/server/security/errors";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const transactions = await listTransactionsForCustomer(profile.id);
  return jsonOk(serializeMoney({ transactions }));
});

const createTransferSchema = z
  .object({
    idempotencyKey: uuidSchema,
    sourceAccountId: uuidSchema,
    destinationAccountId: uuidSchema.optional(),
    beneficiaryId: uuidSchema.optional(),
    amountMinor: amountMinorSchema,
    currency: currencySchema,
    reference: z.string().trim().min(1).max(140),
    description: z.string().trim().max(500).optional(),
  })
  .refine((v) => !!v.destinationAccountId !== !!v.beneficiaryId, {
    message: "Provide exactly one of destinationAccountId or beneficiaryId.",
  });

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();
  const ip = getClientIp(request);

  // Transfers get their own, tighter rate limit distinct from general
  // request throttling — see docs/production/07-security-architecture.md §6.
  await enforceRateLimit({ key: `transfer:${ctx.user.id}`, limit: 20, windowSeconds: 60 * 60, ipAddress: ip, userId: ctx.user.id });

  const profile = await getCustomerProfileByUserId(ctx.user.id);
  const input = await parseJsonBody(request, createTransferSchema);

  if (profile.kyc?.status !== "APPROVED") {
    throw new ValidationError(
      "Transfers require a verified identity. Complete identity verification before sending money."
    );
  }

  const transaction = await createTransfer({
    ...input,
    amountMinor: BigInt(input.amountMinor),
    customerProfileId: profile.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
    ipAddress: ip,
  });

  return jsonOk(serializeMoney({ transaction }), 201);
});

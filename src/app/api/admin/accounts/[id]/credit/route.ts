import { z } from "zod";
import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAdminScope, getClientIp } from "@/server/auth/guards";
import { parseJsonBody, uuidSchema, amountMinorSchema } from "@/server/security/validation";
import { createAdminAccountCredit } from "@/server/services/transactionService";

const creditSchema = z.object({
  idempotencyKey: uuidSchema,
  amountMinor: amountMinorSchema,
  reason: z.string().trim().min(1).max(500),
});

export const POST = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAdminScope("ACCOUNTS_MANAGE");
    const { id } = await params;
    const ip = getClientIp(request);
    const input = await parseJsonBody(request, creditSchema);

    const transaction = await createAdminAccountCredit({
      idempotencyKey: input.idempotencyKey,
      accountId: id,
      amountMinor: BigInt(input.amountMinor),
      reason: input.reason,
      actorUserId: ctx.user.id,
      actorRole: ctx.user.role,
      ipAddress: ip,
    });

    return jsonOk(serializeMoney({ transaction }), 201);
  }
);

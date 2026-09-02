import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAdminScope } from "@/server/auth/guards";
import { adminReviewTransaction } from "@/server/services/transactionService";

const schema = z.object({ decision: z.enum(["APPROVE", "REJECT"]), reason: z.string().trim().max(500).optional() });

export const POST = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAdminScope("TRANSFERS_APPROVE");
    const { id } = await params;
    const { decision, reason } = await parseJsonBody(request, schema);

    const transaction = await adminReviewTransaction({
      transactionId: id,
      decision,
      reason,
      actorUserId: ctx.user.id,
      actorRole: ctx.user.role,
    });

    return jsonOk(serializeMoney({ transaction }));
  }
);

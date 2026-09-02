import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { requireAuth } from "@/server/auth/guards";
import { getTransactionForCustomer } from "@/server/services/transactionService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const GET = withErrorHandling(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requireAuth();
    const profile = await getCustomerProfileByUserId(ctx.user.id);
    const { id } = await params;

    const transaction = await getTransactionForCustomer(id, profile.id);
    return jsonOk(serializeMoney({ transaction }));
  }
);

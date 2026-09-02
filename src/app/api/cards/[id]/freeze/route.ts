import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { freezeCard } from "@/server/services/cardService";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const POST = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAuth();
    const profile = await getCustomerProfileByUserId(ctx.user.id);
    const { id } = await params;

    const card = await freezeCard(id, profile.id, ctx.user.id, ctx.user.role);
    return jsonOk({ card });
  }
);

import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAdminScope } from "@/server/auth/guards";
import { setCustomerStatus } from "@/server/services/adminService";

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]), reason: z.string().trim().min(1).max(500) });

export const POST = withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await assertCsrf(request);
    const ctx = await requireAdminScope("CUSTOMERS_MANAGE");
    const { id } = await params;
    const { status, reason } = await parseJsonBody(request, schema);

    const updated = await setCustomerStatus({ customerUserId: id, status, actorUserId: ctx.user.id, reason });
    return jsonOk({ user: updated });
  }
);

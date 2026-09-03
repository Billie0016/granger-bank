import { z } from "zod";
import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { assertCsrf } from "@/server/security/csrf";
import { parseJsonBody, uuidSchema, currencySchema } from "@/server/security/validation";
import { listAllAccounts } from "@/server/services/adminService";
import { adminOpenDemoAccount } from "@/server/services/accountService";

export const GET = withErrorHandling(async () => {
  await requireAdminScope("ACCOUNTS_VIEW");
  const accounts = await listAllAccounts({});
  return jsonOk(serializeMoney({ accounts }));
});

const openAccountSchema = z.object({
  customerProfileId: uuidSchema,
  type: z.enum(["CHECKING", "SAVINGS", "BUSINESS"]),
  currency: currencySchema,
  displayName: z.string().trim().min(1).max(100),
});

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAdminScope("ACCOUNTS_MANAGE");
  const input = await parseJsonBody(request, openAccountSchema);

  const account = await adminOpenDemoAccount({
    ...input,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
  });

  return jsonOk(serializeMoney({ account }), 201);
});

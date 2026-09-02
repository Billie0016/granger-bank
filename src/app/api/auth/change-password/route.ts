import { z } from "zod";
import { parseJsonBody, passwordSchema } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { changePassword } from "@/server/services/userService";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();

  const { currentPassword, newPassword } = await parseJsonBody(request, schema);
  await changePassword({
    userId: ctx.user.id,
    currentPassword,
    newPassword,
    currentSessionId: ctx.session.id,
  });

  return jsonOk({ message: "Password changed. You've been signed out of all other sessions." });
});

import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { assertCsrf } from "@/server/security/csrf";
import { requireAuth } from "@/server/auth/guards";
import { beginTotpEnrollment } from "@/server/auth/mfa";

export const POST = withErrorHandling(async (request: Request) => {
  await assertCsrf(request);
  const ctx = await requireAuth();

  const { methodId, qrCodeDataUrl, manualEntryKey } = await beginTotpEnrollment(ctx.user.id, ctx.user.email);

  return jsonOk({ methodId, qrCodeDataUrl, manualEntryKey });
});

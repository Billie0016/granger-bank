import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { setCsrfCookie } from "@/server/security/csrf";

/**
 * Issues (or re-issues) the CSRF double-submit cookie. Called once by the
 * client on app load / before rendering any form that will submit a
 * state-changing request. See src/server/security/csrf.ts.
 */
export const GET = withErrorHandling(async () => {
  const token = await setCsrfCookie();
  return jsonOk({ csrfToken: token });
});

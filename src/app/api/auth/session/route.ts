import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { getAuthContext } from "@/server/auth/session";
import { getCustomerProfileOrNull } from "@/server/services/customerService";

export const GET = withErrorHandling(async () => {
  const ctx = await getAuthContext();
  if (!ctx) return jsonOk({ authenticated: false });

  const profile = ctx.user.role === "CUSTOMER" ? await getCustomerProfileOrNull(ctx.user.id) : null;

  return jsonOk({
    authenticated: true,
    mfaRequired: ctx.user.mfaEnabled && !ctx.session.mfaVerifiedAt,
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      role: ctx.user.role,
      status: ctx.user.status,
      mfaEnabled: ctx.user.mfaEnabled,
      name: profile ? `${profile.legalFirstName} ${profile.legalLastName}` : ctx.user.email,
    },
  });
});

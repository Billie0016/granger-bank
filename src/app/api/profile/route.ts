import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAuth } from "@/server/auth/guards";
import { getCustomerProfileByUserId } from "@/server/services/customerService";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();
  const profile = await getCustomerProfileByUserId(ctx.user.id);

  return jsonOk({
    profile: {
      legalFirstName: profile.legalFirstName,
      legalLastName: profile.legalLastName,
      email: ctx.user.email,
      country: profile.country,
      addressLine1: profile.addressLine1,
      city: profile.city,
      region: profile.region,
      postalCode: profile.postalCode,
      segment: profile.segment,
      kycStatus: profile.kyc?.status ?? "NOT_STARTED",
      memberSince: profile.createdAt,
    },
  });
});

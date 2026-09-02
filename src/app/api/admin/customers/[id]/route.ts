import { withErrorHandling, jsonOk, serializeMoney } from "@/server/http/respond";
import { requireAdminScope } from "@/server/auth/guards";
import { getCustomerDetail } from "@/server/services/adminService";

export const GET = withErrorHandling(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdminScope("CUSTOMERS_VIEW");
    const { id } = await params;

    const customer = await getCustomerDetail(id);
    return jsonOk(serializeMoney({ customer }));
  }
);

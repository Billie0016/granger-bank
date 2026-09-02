import { z } from "zod";
import { parseJsonBody } from "@/server/security/validation";
import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { verifyEmail } from "@/server/services/userService";

const schema = z.object({ token: z.string().min(10) });

export const POST = withErrorHandling(async (request: Request) => {
  const { token } = await parseJsonBody(request, schema);
  await verifyEmail(token);
  return jsonOk({ message: "Email verified." });
});

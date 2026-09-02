import { connection } from "next/server";
import { ResetPasswordPageClient } from "./ResetPasswordPageClient";

// See src/app/login/page.tsx for why this forces dynamic rendering.
export default async function ResetPasswordPage() {
  await connection();
  return <ResetPasswordPageClient />;
}

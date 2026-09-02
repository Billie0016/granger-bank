import { connection } from "next/server";
import { ForgotPasswordPageClient } from "./ForgotPasswordPageClient";

// See src/app/login/page.tsx for why this forces dynamic rendering.
export default async function ForgotPasswordPage() {
  await connection();
  return <ForgotPasswordPageClient />;
}

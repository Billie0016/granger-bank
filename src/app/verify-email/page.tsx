import { connection } from "next/server";
import { VerifyEmailPageClient } from "./VerifyEmailPageClient";

// See src/app/login/page.tsx for why this forces dynamic rendering.
export default async function VerifyEmailPage() {
  await connection();
  return <VerifyEmailPageClient />;
}

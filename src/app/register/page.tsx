import { connection } from "next/server";
import { RegisterPageClient } from "./RegisterPageClient";

// See src/app/login/page.tsx for why this forces dynamic rendering.
export default async function RegisterPage() {
  await connection();
  return <RegisterPageClient />;
}

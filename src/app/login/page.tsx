import { connection } from "next/server";
import { LoginPageClient } from "./LoginPageClient";

// Forces dynamic rendering. Required because proxy.ts sets a fresh,
// per-request CSP nonce for this route (see src/lib/security/cspRoutes.ts);
// without this, Next would statically prerender the page at build time with
// no nonce on its own inline bootstrap scripts, which would then mismatch
// the nonce in the per-request CSP header and silently block hydration —
// see next.config.ts for the full explanation of that failure mode.
export default async function LoginPage() {
  await connection();
  return <LoginPageClient />;
}

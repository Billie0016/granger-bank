import { connection } from "next/server";
import { MfaChallengePageClient } from "./MfaChallengePageClient";

// See src/app/login/page.tsx for why this forces dynamic rendering.
export default async function MfaChallengePage() {
  await connection();
  return <MfaChallengePageClient />;
}

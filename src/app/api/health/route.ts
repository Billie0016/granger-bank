import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

/**
 * Liveness/readiness check. See
 * docs/production/08-deployment-architecture.md §5. Deliberately does not
 * check provider reachability here — provider status is a business-logic
 * concern (surfaced per-feature as 503s), not an infra health signal, since
 * "no provider configured" is an expected, valid state pre-Phase 10 and
 * should not make the app report unhealthy.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}

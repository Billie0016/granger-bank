import { withErrorHandling, jsonOk } from "@/server/http/respond";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export const GET = withErrorHandling(async () => {
  const ctx = await requireAuth();

  const sessions = await prisma.session.findMany({
    where: { userId: ctx.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { device: true },
    orderBy: { lastSeenAt: "desc" },
  });

  return jsonOk({
    sessions: sessions.map((s) => ({
      id: s.id,
      isCurrent: s.id === ctx.session.id,
      device: s.device?.name ?? "Unknown device",
      ipAddress: s.ipAddress,
      lastSeenAt: s.lastSeenAt,
      createdAt: s.createdAt,
    })),
  });
});

import { PrismaClient } from "@prisma/client";
import { isProduction } from "./envCore";

/**
 * Prisma client singleton. In development, Next.js hot-reloads server
 * modules, which would otherwise create a new PrismaClient (and a new
 * connection pool) on every edit — this caches it on `globalThis`.
 *
 * This file intentionally has no "server-only" import, unlike db.ts which
 * re-exports it — see rbacCore.ts for why that split exists. Next app code
 * should keep importing from "./db" (or "@/server/db") to keep that
 * tripwire against accidental client-bundle inclusion.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction() ? ["error", "warn"] : ["error", "warn"],
  });

if (!isProduction()) {
  globalForPrisma.prisma = prisma;
}

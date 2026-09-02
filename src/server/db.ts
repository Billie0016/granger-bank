import "server-only";
import { PrismaClient } from "@prisma/client";
import { isProduction } from "./env";

/**
 * Prisma client singleton. In development, Next.js hot-reloads server
 * modules, which would otherwise create a new PrismaClient (and a new
 * connection pool) on every edit — this caches it on `globalThis`.
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

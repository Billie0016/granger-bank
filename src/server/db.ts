import "server-only";

/**
 * Guarded entry point for the Prisma client — everything Next app code
 * should import. The actual implementation lives in dbCore.ts (no
 * "server-only" import) so prisma/seed.ts, a standalone tsx script outside
 * Next's runtime, can use it too (transitively, via rbacCore.ts). See
 * rbacCore.ts for the full explanation.
 */
export * from "./dbCore";

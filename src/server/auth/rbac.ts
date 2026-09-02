import "server-only";

/**
 * Guarded entry point for RBAC — everything Next app code should import.
 * The actual implementation lives in rbacCore.ts (no "server-only" import)
 * so prisma/seed.ts, a standalone tsx script outside Next's runtime, can
 * use it too. See rbacCore.ts for why.
 */
export * from "./rbacCore";

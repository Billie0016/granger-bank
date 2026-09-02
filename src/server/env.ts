import "server-only";

/**
 * Guarded entry point for environment access — everything Next app code
 * should import. Importing "server-only" makes it a build error to import
 * this module from a client component, which is the enforcement mechanism
 * (not just convention) behind "no secret ever reaches the browser" — see
 * docs/production/06-banking-provider-integration.md §5.
 *
 * The actual implementation lives in envCore.ts (no "server-only" import)
 * so prisma/seed.ts, a standalone tsx script outside Next's runtime, can
 * reach isProduction() transitively via dbCore.ts. See rbacCore.ts for the
 * full explanation of this pattern.
 */
export * from "./envCore";

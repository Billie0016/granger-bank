import "server-only";
import { z } from "zod";

/**
 * Typed, validated access to environment variables. Importing "server-only"
 * makes it a build error to import this module from a client component,
 * which is the enforcement mechanism (not just convention) behind
 * "no secret ever reaches the browser" — see
 * docs/production/06-banking-provider-integration.md §5.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SESSION_COOKIE_SECRET: z.string().min(1).optional(),
  CSRF_SECRET: z.string().min(1).optional(),
  FIELD_ENCRYPTION_KEY: z.string().min(1).optional(),

  EMAIL_PROVIDER_API_URL: z.string().optional(),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().optional(),

  BANKING_API_URL: z.string().optional(),
  BANKING_API_KEY: z.string().optional(),
  BANKING_CLIENT_ID: z.string().optional(),
  BANKING_CLIENT_SECRET: z.string().optional(),
  BANKING_WEBHOOK_SIGNING_SECRET: z.string().optional(),

  PAYMENT_API_URL: z.string().optional(),
  PAYMENT_API_KEY: z.string().optional(),

  CARD_PROVIDER_API_URL: z.string().optional(),
  CARD_PROVIDER_API_KEY: z.string().optional(),

  KYC_PROVIDER_API_URL: z.string().optional(),
  KYC_PROVIDER_API_KEY: z.string().optional(),

  FRAUD_PROVIDER_API_URL: z.string().optional(),
  FRAUD_PROVIDER_API_KEY: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Parses and validates process.env once per process. Throws loudly (not a
 * silent fallback) if required variables are missing — a bank should never
 * boot into an ambiguous configuration state. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid/missing environment configuration:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return getEnv().NODE_ENV === "production";
}

export function isDevelopment() {
  return getEnv().NODE_ENV === "development";
}

/**
 * Production-safety guard used at boot and in CI: refuses to start if a
 * provider variable is present but points at something that is obviously
 * not a real provider endpoint. This is what makes "no mock provider in
 * production" an enforced property rather than a policy statement — see
 * docs/production/08-deployment-architecture.md §4.
 */
export function assertNoMockProvidersInProduction() {
  if (!isProduction()) return;
  const suspicious = ["localhost", "stub", "mock", "sandbox", "test", "example.com"];
  const providerUrlKeys = [
    "BANKING_API_URL",
    "PAYMENT_API_URL",
    "CARD_PROVIDER_API_URL",
    "KYC_PROVIDER_API_URL",
    "FRAUD_PROVIDER_API_URL",
  ] as const;

  for (const key of providerUrlKeys) {
    const value = process.env[key];
    if (!value) continue; // absent is fine — that provider just fails closed
    if (suspicious.some((s) => value.toLowerCase().includes(s))) {
      throw new Error(
        `Refusing to boot in production: ${key} looks like a non-production endpoint ("${value}"). ` +
          `Set it to the real, authorized provider URL or leave it unset.`
      );
    }
  }
}

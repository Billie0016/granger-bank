import "server-only";
import * as argon2 from "argon2";

/**
 * Argon2id password hashing. See
 * docs/production/04-authentication-architecture.md §1.
 *
 * Parameters target ≥250ms hash time on typical production hardware per
 * OWASP guidance — tune memoryCost/timeCost after benchmarking the actual
 * deployment target; these are reasonable, conservative defaults.
 */
const HASH_OPTIONS: argon2.HashOptions & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    // Malformed hash, algorithm mismatch, etc. — treat as verification
    // failure, never throw a mismatch into a 500 that might hint at why.
    return false;
  }
}

/**
 * Minimal breached/weak password rejection. This is a starting point — the
 * production checklist in docs/production/04-authentication-architecture.md
 * §1 calls for a real breached-password check (e.g. HaveIBeenPwned's
 * k-anonymity range API) before launch. Implemented as its own function so
 * that upgrade is a one-function change.
 */
const COMMON_PASSWORDS = new Set([
  "password123!",
  "password1234",
  "letmein12345",
  "qwertyuiop12",
  "granger bank",
]);

export function isObviouslyWeakPassword(plaintext: string, context: { email?: string }): string | null {
  const lower = plaintext.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return "That password is far too common. Please choose a stronger one.";
  }
  if (context.email && lower.includes(context.email.toLowerCase().split("@")[0])) {
    return "Your password can't contain part of your email address.";
  }
  return null;
}

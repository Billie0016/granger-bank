import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { getEnv } from "../env";

/**
 * Field-level envelope encryption (AES-256-GCM) for the columns flagged
 * `*Enc` in prisma/schema.prisma — tax id, beneficiary account numbers, MFA
 * secrets. This is a second layer beyond disk/at-rest encryption: it
 * protects those specific values even if a database credential or backup
 * export leaks. See docs/production/07-security-architecture.md §2.
 *
 * FIELD_ENCRYPTION_KEY must be a 32-byte key, base64-encoded. Generate with:
 *   openssl rand -base64 32
 */

function getKey(): Buffer {
  const env = getEnv();
  if (!env.FIELD_ENCRYPTION_KEY) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY is not set. Refusing to encrypt/decrypt sensitive fields without it."
    );
  }
  const key = Buffer.from(env.FIELD_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

/** Returns `${ivHex}:${authTagHex}:${ciphertextHex}` — self-contained so no
 * separate IV storage column is needed. */
export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV, standard for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptField(payload: string): string {
  const key = getKey();
  const [ivHex, authTagHex, ciphertextHex] = payload.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted field payload.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** One-way hash for values we need to look up by equality but never
 * decrypt (e.g. token lookups) — sha256 is appropriate here because the
 * inputs are high-entropy random tokens, not low-entropy secrets like
 * passwords (which use Argon2id in passwords.ts instead). */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

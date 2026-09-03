import "server-only";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { randomBytes } from "node:crypto";
import { prisma } from "../db";
import { encryptField, decryptField, sha256Hex } from "../security/encryption";

/**
 * TOTP-based MFA. See docs/production/04-authentication-architecture.md §3
 * and docs/production/07-security-architecture.md §9 (mandatory for admins).
 *
 * otplib defaults to `window: 0` — zero tolerance, only the exact current
 * 30-second step is accepted. That's stricter than any real authenticator
 * app expects: there's no such thing as perfectly synchronized clocks
 * between a phone and a server, and a human reading a code off their phone
 * and typing it in takes a few real seconds, which is enough on its own to
 * cross a 30-second step boundary. With window: 0 this manifests as
 * "Invalid verification code" that fails consistently, including on a
 * code entered immediately after it refreshes, because there is never any
 * margin at all. `window: 1` accepts the previous, current, and next step
 * (a ±30s tolerance) — the standard recommendation for TOTP verification
 * (matching what Google Authenticator, Authy, etc. are built to tolerate).
 */
authenticator.options = { window: 1 };

const ISSUER = "Granger Bank";
const RECOVERY_CODE_COUNT = 10;

/** Idempotent by design: if this user already has an unverified TOTP method,
 * reuse its secret instead of minting a new one. The setup page's enrollment
 * call can legitimately fire more than once for a single visit (React Strict
 * Mode double-invokes effects in dev, and a page reload or duplicate request
 * would do the same in any environment) — without this, each call generated
 * and persisted a brand new secret, so two near-simultaneous calls raced to
 * both insert a row, and whichever response the browser rendered last could
 * silently replace the QR code / manual key on screen after the user had
 * already scanned the first one into their authenticator app. Every code
 * they then entered was checked against a secret their phone never had,
 * and was rejected no matter how correctly it was typed.
 *
 * A plain "check, then create if missing" isn't enough on its own: two
 * concurrent calls can both run the check before either has inserted,
 * both conclude nothing exists yet, and both insert their own secret —
 * same bug, just a narrower window. The advisory lock below serializes
 * concurrent calls for the same user so the second one always sees the
 * first one's insert before deciding whether to create its own.
 */
export async function beginTotpEnrollment(userId: string, email: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const existing = await tx.mfaMethod.findFirst({
      where: { userId, type: "TOTP", verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (existing?.secretEnc) {
      const secret = decryptField(existing.secretEnc);
      const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return { methodId: existing.id, qrCodeDataUrl, manualEntryKey: secret };
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Stored immediately but unverified (verifiedAt: null) — enrollment isn't
    // active until the user proves possession via confirmTotpEnrollment.
    const method = await tx.mfaMethod.create({
      data: { userId, type: "TOTP", secretEnc: encryptField(secret) },
    });

    return { methodId: method.id, qrCodeDataUrl, manualEntryKey: secret };
  });
}

export async function confirmTotpEnrollment(userId: string, methodId: string, code: string): Promise<boolean> {
  const method = await prisma.mfaMethod.findFirst({ where: { id: methodId, userId, type: "TOTP" } });
  if (!method?.secretEnc) return false;

  const secret = decryptField(method.secretEnc);
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) return false;

  await prisma.$transaction([
    prisma.mfaMethod.update({ where: { id: methodId }, data: { verifiedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } }),
  ]);

  return true;
}

export async function verifyTotpForUser(userId: string, code: string): Promise<boolean> {
  const method = await prisma.mfaMethod.findFirst({
    where: { userId, type: "TOTP", verifiedAt: { not: null } },
  });
  if (!method?.secretEnc) return false;

  const secret = decryptField(method.secretEnc);
  return authenticator.verify({ token: code, secret });
}

export async function disableMfa(userId: string) {
  await prisma.$transaction([
    prisma.mfaMethod.deleteMany({ where: { userId } }),
    prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false } }),
  ]);
}

/** Returns the plaintext codes exactly once, at generation time, for the
 * user to save — only their hashes are ever persisted. */
export async function generateRecoveryCodes(userId: string): Promise<string[]> {
  await prisma.mfaRecoveryCode.deleteMany({ where: { userId, usedAt: null } });

  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-")
  );

  await prisma.mfaRecoveryCode.createMany({
    data: codes.map((code) => ({ userId, codeHash: sha256Hex(code) })),
  });

  return codes;
}

export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const codeHash = sha256Hex(code.trim().toUpperCase());
  const record = await prisma.mfaRecoveryCode.findFirst({
    where: { userId, codeHash, usedAt: null },
  });
  if (!record) return false;

  await prisma.mfaRecoveryCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return true;
}

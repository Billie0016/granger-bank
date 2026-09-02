import "server-only";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { randomBytes } from "node:crypto";
import { prisma } from "../db";
import { encryptField, decryptField, sha256Hex } from "../security/encryption";

/**
 * TOTP-based MFA. See docs/production/04-authentication-architecture.md §3
 * and docs/production/07-security-architecture.md §9 (mandatory for admins).
 */

const ISSUER = "Granger Bank";
const RECOVERY_CODE_COUNT = 10;

export async function beginTotpEnrollment(userId: string, email: string) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Stored immediately but unverified (verifiedAt: null) — enrollment isn't
  // active until the user proves possession via confirmTotpEnrollment.
  await prisma.mfaMethod.deleteMany({ where: { userId, type: "TOTP", verifiedAt: null } });
  const method = await prisma.mfaMethod.create({
    data: { userId, type: "TOTP", secretEnc: encryptField(secret) },
  });

  return { methodId: method.id, qrCodeDataUrl, manualEntryKey: secret };
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

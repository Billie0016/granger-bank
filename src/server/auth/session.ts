import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../db";
import { sha256Hex } from "../security/encryption";
import { isProduction } from "../env";
import type { Session, User, UserRole } from "@prisma/client";

/**
 * Server-issued sessions, replacing the current localStorage-based
 * "auth" entirely. See docs/production/04-authentication-architecture.md §2.
 *
 * The session cookie holds a random opaque token. Only sha256(token) is
 * stored in the database (as the Session.id primary key) — the raw token
 * itself never touches the database, so a database read (backup, replica,
 * compromised credential) cannot be used to mint a valid session cookie.
 */

const SESSION_COOKIE = "gb_session";
const DEVICE_COOKIE = "gb_device";

const IDLE_TIMEOUT_MINUTES = 30;
const ABSOLUTE_TIMEOUT_HOURS = 12;
const REMEMBER_ME_ABSOLUTE_DAYS = 30;
const ADMIN_IDLE_TIMEOUT_MINUTES = 15;

export type AuthContext = {
  session: Session;
  user: User;
};

function newRawToken(): string {
  return randomBytes(32).toString("base64url");
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Reads (or creates) the long-lived, low-sensitivity device identifier
 * cookie used to recognize returning browsers for §7 (new-device
 * notifications) without relying solely on User-Agent string matching. */
export async function getOrSetDeviceCookieId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DEVICE_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(DEVICE_COOKIE, id, cookieOptions(60 * 60 * 24 * 365));
  return id;
}

async function getOrCreateDevice(userId: string, ipAddress: string, userAgent: string) {
  const fingerprint = await getOrSetDeviceCookieId();
  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint } },
  });

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
    return { device: existing, isNewDevice: false };
  }

  const device = await prisma.device.create({
    data: { userId, fingerprint, name: describeUserAgent(userAgent) },
  });
  return { device, isNewDevice: true };
}

function describeUserAgent(userAgent: string): string {
  // Deliberately simple — a real implementation might use a UA-parsing
  // library, but this avoids pulling one in for cosmetic display text only.
  if (/iphone/i.test(userAgent)) return "iPhone";
  if (/ipad/i.test(userAgent)) return "iPad";
  if (/android/i.test(userAgent)) return "Android device";
  if (/macintosh/i.test(userAgent)) return "Mac";
  if (/windows/i.test(userAgent)) return "Windows PC";
  return "Unknown device";
}

export async function createSession(params: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  rememberMe?: boolean;
}): Promise<{ isNewDevice: boolean }> {
  const rawToken = newRawToken();
  const id = sha256Hex(rawToken);

  const { device, isNewDevice } = await getOrCreateDevice(params.userId, params.ipAddress, params.userAgent);

  const absoluteMs = params.rememberMe
    ? REMEMBER_ME_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000
    : ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000;

  await prisma.session.create({
    data: {
      id,
      userId: params.userId,
      deviceId: device.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt: new Date(Date.now() + absoluteMs),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, cookieOptions(Math.floor(absoluteMs / 1000)));

  return { isNewDevice };
}

/** Resolves the current request's session + user, or null. This is the
 * single choke point every route handler and server component uses —
 * there is no other way for server code to learn "who is this" than
 * through this function reading the HttpOnly cookie and checking the
 * database, never trusting anything the client asserts about itself. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  const id = sha256Hex(rawToken);
  const session = await prisma.session.findUnique({ where: { id }, include: { user: true } });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  const idleLimitMinutes = session.user.role === "ADMIN" ? ADMIN_IDLE_TIMEOUT_MINUTES : IDLE_TIMEOUT_MINUTES;
  const idleDeadline = new Date(session.lastSeenAt.getTime() + idleLimitMinutes * 60 * 1000);
  if (idleDeadline < new Date()) {
    await revokeSession(session.id, "idle_timeout");
    return null;
  }

  // Refresh idle window on activity (throttled to avoid a write on every
  // request would be a further optimization; correctness first).
  await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });

  const { user, ...rest } = session;
  return { session: rest as Session, user };
}

export async function revokeSession(sessionId: string, reason: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

export async function revokeAllSessionsForUser(userId: string, reason: string, exceptSessionId?: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function markSessionMfaVerified(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { mfaVerifiedAt: new Date() } });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export type { UserRole };

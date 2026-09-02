import "server-only";
import { prisma } from "../db";
import { NotFoundError } from "../security/errors";

export async function getCustomerProfileByUserId(userId: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { kyc: true },
  });
  if (!profile) throw new NotFoundError("Customer profile not found.");
  return profile;
}

export async function getCustomerProfileOrNull(userId: string) {
  return prisma.customerProfile.findUnique({ where: { userId }, include: { kyc: true } });
}

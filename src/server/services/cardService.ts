import "server-only";
import { prisma } from "../db";
import { getCardProvider } from "../providers/registry";
import { assertAccountOwnership } from "./accountService";
import { writeAuditLog } from "../security/audit";
import { ForbiddenError, NotFoundError } from "../security/errors";
import type { UserRole } from "@prisma/client";

export async function listCardsForCustomer(customerProfileId: string) {
  return prisma.card.findMany({
    where: { account: { customerProfileId } },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });
}

async function assertCardOwnership(cardId: string, customerProfileId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { account: true } });
  if (!card) throw new NotFoundError("Card not found.");
  if (card.account.customerProfileId !== customerProfileId) throw new ForbiddenError();
  return card;
}

/** Card actions call the real CardProvider and fail closed
 * (ProviderNotConfiguredError) until one is configured — the local
 * CardStatus is only ever updated after the provider confirms the change,
 * never optimistically. */
export async function freezeCard(cardId: string, customerProfileId: string, actorUserId: string, actorRole: UserRole) {
  const card = await assertCardOwnership(cardId, customerProfileId);
  if (!card.providerCardRef) {
    throw new NotFoundError("This card has not been issued by a card provider yet.");
  }

  await getCardProvider().freezeCard(card.providerCardRef);

  const updated = await prisma.card.update({ where: { id: cardId }, data: { status: "FROZEN" } });
  await writeAuditLog({
    actorUserId,
    actorRole,
    action: "card.frozen",
    targetType: "Card",
    targetId: cardId,
  });
  return updated;
}

export async function unfreezeCard(cardId: string, customerProfileId: string, actorUserId: string, actorRole: UserRole) {
  const card = await assertCardOwnership(cardId, customerProfileId);
  if (!card.providerCardRef) {
    throw new NotFoundError("This card has not been issued by a card provider yet.");
  }

  await getCardProvider().unfreezeCard(card.providerCardRef);

  const updated = await prisma.card.update({ where: { id: cardId }, data: { status: "ACTIVE" } });
  await writeAuditLog({
    actorUserId,
    actorRole,
    action: "card.unfrozen",
    targetType: "Card",
    targetId: cardId,
  });
  return updated;
}

/** Requests a new card for an account. Creates a local record of intent
 * (PENDING_ISSUANCE, no providerCardRef) — actual issuance requires the
 * CardProvider, which fails closed until configured. */
export async function requestCardIssuance(params: {
  accountId: string;
  customerProfileId: string;
  type: "DEBIT" | "CREDIT" | "BUSINESS";
  actorUserId: string;
  actorRole: UserRole;
}) {
  await assertAccountOwnership(params.accountId, params.customerProfileId);

  const card = await prisma.card.create({
    data: { accountId: params.accountId, type: params.type, status: "PENDING_ISSUANCE" },
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "card.issuance_requested",
    targetType: "Card",
    targetId: card.id,
  });

  return card;
}

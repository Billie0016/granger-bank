/**
 * Development/staging seed data ONLY. Never run against production — see
 * docs/production/08-deployment-architecture.md §4, which documents the
 * hostname check below as one of the enforced (not just policy) guards
 * against demo data reaching a real deployment.
 *
 * Every seeded identity uses the @seed.grangerbank.internal domain so it
 * can never be mistaken for a real customer/admin in a screenshot, log
 * line, or support ticket.
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { grantScopes } from "../src/server/auth/rbacCore";

const prisma = new PrismaClient();

/** Finds this customer's account of the given type, or creates one with a
 * real Prisma-generated UUID id (never a custom string — see the comment
 * at its call site). Not a generic upsert because Account has no unique
 * constraint on (customerProfileId, type) to upsert against. */
async function findOrCreateSeedAccount(params: {
  customerProfileId: string;
  type: "CHECKING" | "SAVINGS";
  displayName: string;
  maskedNumber: string;
  internalLedgerBalanceMinor: bigint;
}) {
  const existing = await prisma.account.findFirst({
    where: { customerProfileId: params.customerProfileId, type: params.type },
  });
  if (existing) {
    return prisma.account.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        maskedNumber: params.maskedNumber,
        internalLedgerBalanceMinor: params.internalLedgerBalanceMinor,
      },
    });
  }
  return prisma.account.create({
    data: {
      customerProfileId: params.customerProfileId,
      type: params.type,
      currency: "USD",
      displayName: params.displayName,
      maskedNumber: params.maskedNumber,
      status: "ACTIVE",
      internalLedgerBalanceMinor: params.internalLedgerBalanceMinor,
    },
  });
}

function assertNotProductionDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV=production.");
  }
  if (/rds\.amazonaws|cloudsql|prod|production/i.test(url)) {
    throw new Error("Refusing to seed: DATABASE_URL looks like a production database.");
  }
}

async function main() {
  assertNotProductionDatabase();

  const password = await argon2.hash("DemoPassword123", { type: argon2.argon2id });

  // --- Demo customer -------------------------------------------------
  const customerUser = await prisma.user.upsert({
    where: { email: "demo.customer@seed.grangerbank.internal" },
    update: {},
    create: {
      email: "demo.customer@seed.grangerbank.internal",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      status: "PENDING_VERIFICATION", // honest: KYC has not been completed
      role: "CUSTOMER",
      customerProfile: {
        create: {
          legalFirstName: "Jordan",
          legalLastName: "Rivera",
          dateOfBirth: new Date("1992-04-14"),
          country: "US",
          addressLine1: "100 Market Street",
          city: "San Francisco",
          region: "CA",
          postalCode: "94103",
          segment: "PERSONAL",
          kyc: { create: { status: "NOT_STARTED" } },
        },
      },
    },
    include: { customerProfile: true },
  });

  const profile =
    customerUser.customerProfile ??
    (await prisma.customerProfile.findUniqueOrThrow({ where: { userId: customerUser.id } }));

  // Two ACTIVE, funded accounts — deliberately fake seeded money, no
  // provider ref, so createInternalTransfer (src/server/services/
  // transactionService.ts) has something real to move between them and the
  // internal-transfer demo works end-to-end without a banking provider.
  // This is an explicit, narrow exception to "no balance is fabricated"
  // elsewhere in the app: see internalLedgerBalanceMinor in schema.prisma.
  //
  // A previous version of this script upserted by a custom deterministic
  // id (`${profile.id}-checking-seed`) instead of letting Prisma generate
  // Account.id's real UUID (its @default(uuid())). That silently broke
  // every transfer through this account: the API validates account ids
  // with a strict uuidSchema (see src/server/security/validation.ts) and
  // rejected the custom id as invalid input. Delete any leftover rows in
  // that old shape before find-or-creating properly, so re-running this
  // script against a database seeded by the old version self-heals.
  await prisma.account.deleteMany({
    where: { id: { in: [`${profile.id}-checking-seed`, `${profile.id}-savings-seed`] } },
  });

  await findOrCreateSeedAccount({
    customerProfileId: profile.id,
    type: "CHECKING",
    displayName: "Everyday Checking",
    maskedNumber: "•••• 4821",
    internalLedgerBalanceMinor: BigInt(245000), // $2,450.00
  });

  await findOrCreateSeedAccount({
    customerProfileId: profile.id,
    type: "SAVINGS",
    displayName: "High-Yield Savings",
    maskedNumber: "•••• 7743",
    internalLedgerBalanceMinor: BigInt(890000), // $8,900.00
  });

  // --- Demo admin (Super Admin bundle) --------------------------------
  const adminUser = await prisma.user.upsert({
    where: { email: "demo.admin@seed.grangerbank.internal" },
    update: {},
    create: {
      email: "demo.admin@seed.grangerbank.internal",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
      role: "ADMIN",
    },
  });

  await grantScopes({
    userId: adminUser.id,
    grantedById: adminUser.id, // bootstrap grant — the very first admin has no other grantor
    scopes: [
      "CUSTOMERS_VIEW",
      "CUSTOMERS_MANAGE",
      "ACCOUNTS_VIEW",
      "ACCOUNTS_MANAGE",
      "TRANSACTIONS_VIEW",
      "TRANSFERS_APPROVE",
      "CARDS_MANAGE",
      "SUPPORT_RESPOND",
      "COMPLIANCE_REVIEW",
      "RISK_REVIEW",
      "AUDIT_LOG_VIEW",
      "SETTINGS_MANAGE",
      "ADMIN_MANAGE",
    ],
  });

  console.log("Seed complete.");
  console.log("  Customer login: demo.customer@seed.grangerbank.internal / DemoPassword123");
  console.log("    Everyday Checking: $2,450.00 · High-Yield Savings: $8,900.00 (fake seeded money)");
  console.log("  Admin login:    demo.admin@seed.grangerbank.internal / DemoPassword123");
  console.log("  (Admin MFA is not enrolled yet — enroll it from Security settings; the");
  console.log("   admin console requires a completed MFA challenge on every session.)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

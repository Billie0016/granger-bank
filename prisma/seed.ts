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

  // One PENDING account — a real record of "customer requested a checking
  // account," not a fake funded account. No balance, no provider ref.
  await prisma.account.upsert({
    where: { id: `${profile.id}-checking-seed` },
    update: {},
    create: {
      id: `${profile.id}-checking-seed`,
      customerProfileId: profile.id,
      type: "CHECKING",
      currency: "USD",
      displayName: "Everyday Checking",
      status: "PENDING",
    },
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

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  LayoutDashboard,
  Users,
  Landmark,
  Receipt,
  ArrowLeftRight,
  CreditCard,
  LifeBuoy,
  Bell,
  ScrollText,
  Settings,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { getAuthContext } from "@/server/auth/session";
import { getEffectiveScopes } from "@/server/auth/rbac";
import type { AdminScope } from "@prisma/client";

// Every route under /admin depends on the request's session cookie and
// live database state — never statically prerenderable.
export const dynamic = "force-dynamic";

const ALL_NAV_ITEMS: (NavItem & { scope: AdminScope })[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, scope: "CUSTOMERS_VIEW" },
  { href: "/admin/customers", label: "Customers", icon: Users, scope: "CUSTOMERS_VIEW" },
  { href: "/admin/accounts", label: "Accounts", icon: Landmark, scope: "ACCOUNTS_VIEW" },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt, scope: "TRANSACTIONS_VIEW" },
  { href: "/admin/transfers", label: "Transfers", icon: ArrowLeftRight, scope: "TRANSFERS_APPROVE" },
  { href: "/admin/cards", label: "Cards", icon: CreditCard, scope: "CARDS_MANAGE" },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, scope: "SUPPORT_RESPOND" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, scope: "AUDIT_LOG_VIEW" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, scope: "AUDIT_LOG_VIEW" },
  { href: "/admin/settings", label: "Settings", icon: Settings, scope: "SETTINGS_MANAGE" },
];

/**
 * Server-side auth + RBAC gate for the entire admin console. Admin MFA is
 * mandatory (docs/production/07-security-architecture.md §9): an admin who
 * hasn't enrolled MFA yet is confined to /admin/setup-mfa and nowhere else;
 * an admin whose current session hasn't completed an MFA challenge is sent
 * to the shared /mfa-challenge page. The nav is filtered to each admin's
 * actual granted scopes — no admin sees a section they can't act on.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.role !== "ADMIN") redirect("/dashboard");

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isSetupMfaPage = pathname === "/admin/setup-mfa";

  if (!ctx.user.mfaEnabled && !isSetupMfaPage) redirect("/admin/setup-mfa");
  if (ctx.user.mfaEnabled && !ctx.session.mfaVerifiedAt) redirect("/mfa-challenge?from=/admin");

  if (isSetupMfaPage) {
    // Minimal chrome-free render for the forced enrollment step.
    return <>{children}</>;
  }

  const scopes = await getEffectiveScopes(ctx.user.id);
  const navItems = ALL_NAV_ITEMS.filter((item) => scopes.includes(item.scope));

  return (
    <DashboardShell navItems={navItems} roleLabel="Admin Console" userName={ctx.user.email}>
      {children}
    </DashboardShell>
  );
}

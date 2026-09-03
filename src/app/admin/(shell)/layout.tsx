import { redirect } from "next/navigation";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { getAuthContext } from "@/server/auth/session";
import { getEffectiveScopes } from "@/server/auth/rbac";
import type { AdminScope } from "@prisma/client";

// Every route here depends on the request's session cookie and live
// database state — never statically prerenderable.
export const dynamic = "force-dynamic";

// icon is a string key (see DashboardShell's NAV_ICONS), not a component
// reference — see the comment on dashboard/layout.tsx's navItems for why.
const ALL_NAV_ITEMS: (NavItem & { scope: AdminScope })[] = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard", scope: "CUSTOMERS_VIEW" },
  { href: "/admin/customers", label: "Customers", icon: "Users", scope: "CUSTOMERS_VIEW" },
  { href: "/admin/accounts", label: "Accounts", icon: "Landmark", scope: "ACCOUNTS_VIEW" },
  { href: "/admin/transactions", label: "Transactions", icon: "Receipt", scope: "TRANSACTIONS_VIEW" },
  { href: "/admin/transfers", label: "Transfers", icon: "ArrowLeftRight", scope: "TRANSFERS_APPROVE" },
  { href: "/admin/cards", label: "Cards", icon: "CreditCard", scope: "CARDS_MANAGE" },
  { href: "/admin/support", label: "Support", icon: "LifeBuoy", scope: "SUPPORT_RESPOND" },
  { href: "/admin/notifications", label: "Notifications", icon: "Bell", scope: "AUDIT_LOG_VIEW" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "ScrollText", scope: "AUDIT_LOG_VIEW" },
  { href: "/admin/settings", label: "Settings", icon: "Settings", scope: "SETTINGS_MANAGE" },
];

/**
 * DashboardShell chrome for every admin page except /admin/setup-mfa, which
 * sits outside this route group specifically so it never gets this chrome —
 * see the comment in ../layout.tsx for why that used to be a pathname
 * branch in one shared layout instead, and why that caused an infinite
 * client-side re-fetch loop. The parent layout already ran the auth gate
 * (session, role, MFA-enrollment redirects); this one re-checks session +
 * scopes only to build the nav, not as a second security boundary.
 */
export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const scopes = await getEffectiveScopes(ctx.user.id);
  const navItems = ALL_NAV_ITEMS.filter((item) => scopes.includes(item.scope));

  return (
    <DashboardShell navItems={navItems} roleLabel="Admin Console" userName={ctx.user.email}>
      {children}
    </DashboardShell>
  );
}

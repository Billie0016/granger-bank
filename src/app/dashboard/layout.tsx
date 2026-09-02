import { redirect } from "next/navigation";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";
import { getAuthContext } from "@/server/auth/session";
import { getCustomerProfileOrNull } from "@/server/services/customerService";

// Every route under /dashboard depends on the request's session cookie and
// live database state — never statically prerenderable, and must never be
// cached across users. See docs/production/07-security-architecture.md.
export const dynamic = "force-dynamic";

// icon is a string key (see DashboardShell's NAV_ICONS), not a component
// reference — this array is built in a Server Component and passed as a
// prop into DashboardShell, a Client Component; only plain, serializable
// data can cross that boundary, and a lucide-react icon is a forwardRef
// object with a `render` method, which React's Flight serializer rejects.
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/dashboard/accounts", label: "Accounts", icon: "Landmark" },
  { href: "/dashboard/transfers", label: "Transfers", icon: "ArrowLeftRight" },
  { href: "/dashboard/payments", label: "Payments", icon: "Send" },
  { href: "/dashboard/cards", label: "Cards", icon: "CreditCard" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "Receipt" },
  { href: "/dashboard/statements", label: "Statements", icon: "FileText" },
  { href: "/dashboard/beneficiaries", label: "Beneficiaries", icon: "Users" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "Bell" },
  { href: "/dashboard/profile", label: "Profile", icon: "User" },
  { href: "/dashboard/security", label: "Security", icon: "ShieldCheck" },
  { href: "/dashboard/help", label: "Help", icon: "HelpCircle" },
];

/**
 * Server-side auth gate. This — not the client-side redirect that used to
 * live in useRequireAuth — is the real security boundary: the DB session
 * lookup happens before any protected content is ever rendered or sent to
 * the client. See docs/production/04-authentication-architecture.md §2.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.role !== "CUSTOMER") redirect("/admin");
  if (ctx.user.mfaEnabled && !ctx.session.mfaVerifiedAt) redirect("/mfa-challenge?from=/dashboard");

  const profile = await getCustomerProfileOrNull(ctx.user.id);
  const userName = profile ? `${profile.legalFirstName} ${profile.legalLastName}` : ctx.user.email;

  return (
    <DashboardShell navItems={navItems} roleLabel="Digital Banking" userName={userName}>
      {children}
    </DashboardShell>
  );
}

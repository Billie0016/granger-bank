import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthContext } from "@/server/auth/session";

// Every route under /admin depends on the request's session cookie and
// live database state — never statically prerenderable.
export const dynamic = "force-dynamic";

/**
 * Server-side auth gate for the entire admin console. Admin MFA is
 * mandatory (docs/production/07-security-architecture.md §9): an admin who
 * hasn't enrolled MFA yet is confined to /admin/setup-mfa and nowhere else;
 * an admin whose current session hasn't completed an MFA challenge is sent
 * to the shared /mfa-challenge page.
 *
 * This layout applies to every /admin/* route, including /admin/setup-mfa,
 * and deliberately always renders the exact same shape (just {children}) —
 * it must NOT branch its own rendered structure on which specific page is
 * active. An earlier version conditionally wrapped children in
 * DashboardShell here based on a pathname string comparison, which caused
 * an infinite client-side RSC re-fetch loop on /admin/setup-mfa (identical
 * ?_rsc= requests firing continuously, reproducible in both dev and a
 * production build): Next's client router doesn't expect a layout's output
 * shape to vary per-page like that and appears to loop trying to reconcile
 * the mismatch. The DashboardShell chrome now lives in
 * "(shell)/layout.tsx", a route group that every admin page except
 * setup-mfa sits inside — Next's own file-based routing decides which
 * layout applies, instead of a manual pathname check deciding what to
 * render.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.role !== "ADMIN") redirect("/dashboard");

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isSetupMfaPage = pathname === "/admin/setup-mfa";

  if (!ctx.user.mfaEnabled && !isSetupMfaPage) redirect("/admin/setup-mfa");
  if (ctx.user.mfaEnabled && !ctx.session.mfaVerifiedAt) redirect("/mfa-challenge?from=/admin");

  return <>{children}</>;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { apiFetch } from "@/lib/apiClient";
import { cn } from "@/lib/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-2 border-b border-line px-6">
        <Link href="/">
          <Logo className="text-base" />
        </Link>
      </div>
      <p className="px-6 pt-5 text-[11px] uppercase tracking-[0.2em] text-mist">{roleLabel}</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-gold/10 text-gold"
                  : "text-ivory-dim hover:bg-ivory/[0.05] hover:text-ivory"
              )}
            >
              <item.icon size={17} className={active ? "text-gold" : "text-mist"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory-dim transition-colors hover:bg-ivory/[0.05] hover:text-ivory"
        >
          <LogOut size={17} className="text-mist" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-line bg-ink-2/60 lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-ink-2 lg:hidden"
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-line bg-ink/80 px-6 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center text-ivory lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden text-sm text-mist lg:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-ivory-dim hover:text-ivory">
              <Bell size={16} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-2 via-gold to-gold-3 text-xs font-medium text-ink">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <span className="hidden text-sm text-ivory sm:block">{userName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

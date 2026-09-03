"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { StaticCardFallback } from "@/components/three/StaticCardFallback";

export function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch<{ mfaRequired: boolean }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe: remember }),
      });

      if (result.mfaRequired) {
        window.location.href = "/mfa-challenge";
        return;
      }

      // Ask the server which console this session belongs to rather than
      // guessing from the email client-side (that guess is exactly the
      // vulnerability the old prototype had — see
      // docs/production/01-current-architecture-audit.md §2).
      const session = await apiFetch<{ user: { role: "CUSTOMER" | "ADMIN" } }>("/api/auth/session");
      // A hard navigation, not router.push()+router.refresh(): the admin
      // destination often immediately server-redirects again (to
      // /admin/setup-mfa or /mfa-challenge, see src/app/admin/layout.tsx),
      // and chaining a client-side soft navigation into a server redirect
      // like that got the Next.js client router's internal state stuck,
      // causing an infinite loop of identical RSC re-fetches on the
      // redirect target (reproduced in both dev and a production build). A
      // full navigation sidesteps that reconciliation path entirely, and is
      // also simply correct here regardless: it guarantees the freshly-set
      // session cookie is used for a clean server render rather than
      // reusing any client-side state cached from before authentication.
      window.location.href = session.user.role === "ADMIN" ? "/admin" : "/dashboard";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-2 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/4 h-[420px] w-[420px] rounded-full bg-gold/[0.08] blur-[130px]" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-emerald/[0.06] blur-[130px]" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2 text-sm text-ivory-dim hover:text-ivory">
          <ArrowLeft size={16} /> Back to grangerbank.example
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <StaticCardFallback className="max-w-sm" />
          </motion.div>
          <h2 className="mt-10 max-w-sm font-display text-3xl leading-tight text-balance">
            Private banking discipline, digital-first execution.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
            Sign in to view balances, move money and manage your Granger Bank
            accounts — all in one secure place.
          </p>
        </div>

        <p className="relative z-10 text-[10px] text-[#454b56]">
          © 2026 Granger Bank — a fictional platform for demonstration purposes.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 sm:px-16 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo className="text-xl" />
          </Link>

          <div className="mt-10 lg:mt-0">
            <h1 className="font-display text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm text-mist">
              Sign in to access your Granger Bank dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                className="w-full rounded-xl border border-line bg-ink-3 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs uppercase tracking-[0.14em] text-mist">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-2">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-line bg-ink-3 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-ivory-dim">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-line-strong bg-ink-3 accent-[#c9a458]"
              />
              Remember me on this device
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            <p className="text-center text-xs text-mist">
              New to Granger Bank?{" "}
              <Link href="/register" className="text-gold hover:text-gold-2">
                Open an account
              </Link>
            </p>
          </form>

          <p className="mt-9 text-center text-[10px] leading-relaxed text-[#454b56]">
            Granger Bank is a fictional platform created for demonstration purposes and is not a
            licensed financial institution. No real funds are held or transferred.
          </p>
        </div>
      </div>
    </div>
  );
}

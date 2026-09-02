"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

export function ForgotPasswordPageClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-8 flex items-center gap-2 text-sm text-ivory-dim hover:text-ivory">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-gold" size={32} />
              <h1 className="mt-4 font-display text-xl">Check your email</h1>
              <p className="mt-2 text-sm text-mist">
                If an account exists for {email}, a reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h1 className="font-display text-xl">Reset your password</h1>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

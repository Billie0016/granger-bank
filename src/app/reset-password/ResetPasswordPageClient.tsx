"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-gold" size={32} />
        <h1 className="mt-4 font-display text-xl">Password updated</h1>
        <Button href="/login" size="lg" className="mt-6 w-full">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="font-display text-xl">Choose a new password</h1>
      <input
        type="password"
        required
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
      />
      <input
        type="password"
        required
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}

export function ResetPasswordPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-mist">
          <Link href="/login" className="text-gold hover:text-gold-2">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

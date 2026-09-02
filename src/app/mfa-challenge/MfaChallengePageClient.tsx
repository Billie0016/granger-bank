"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

function MfaChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code, isRecoveryCode: useRecoveryCode }),
      });
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">
          {useRecoveryCode ? "Recovery code" : "Authentication code"}
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode={useRecoveryCode ? "text" : "numeric"}
          maxLength={useRecoveryCode ? 20 : 6}
          required
          autoFocus
          className="w-full rounded-xl border border-line bg-ink-3 px-4 py-3 text-center text-lg tracking-[0.2em] text-ivory focus:border-gold/50 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Verifying…" : "Verify"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setUseRecoveryCode((v) => !v);
          setCode("");
        }}
        className="w-full text-center text-xs text-gold hover:text-gold-2"
      >
        {useRecoveryCode ? "Use authenticator app instead" : "Use a recovery code instead"}
      </button>
    </form>
  );
}

export function MfaChallengePageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-gold" size={22} />
            <h1 className="font-display text-xl">Verify it&apos;s you</h1>
          </div>
          <Suspense fallback={null}>
            <MfaChallengeForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

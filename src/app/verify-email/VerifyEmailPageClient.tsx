"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    apiFetch("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
  }, [token]);

  if (status === "loading") return <p className="text-sm text-mist">Verifying your email…</p>;

  if (status === "success") {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-gold" size={32} />
        <h1 className="mt-4 font-display text-xl">Email verified</h1>
        <p className="mt-2 text-sm text-mist">You can now sign in to your account.</p>
        <Button href="/login" size="lg" className="mt-6 w-full">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircle className="mx-auto text-danger" size={32} />
      <h1 className="mt-4 font-display text-xl">Verification failed</h1>
      <p className="mt-2 text-sm text-mist">{message}</p>
    </div>
  );
}

export function VerifyEmailPageClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          <Suspense fallback={<p className="text-sm text-mist">Loading…</p>}>
            <VerifyEmailStatus />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

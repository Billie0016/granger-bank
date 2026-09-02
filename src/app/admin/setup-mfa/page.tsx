"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

type Step = "loading" | "scan" | "recovery" | "error";

export default function AdminSetupMfaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [methodId, setMethodId] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<{ methodId: string; qrCodeDataUrl: string; manualEntryKey: string }>("/api/auth/mfa/enroll", {
      method: "POST",
    })
      .then((data) => {
        setMethodId(data.methodId);
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setManualEntryKey(data.manualEntryKey);
        setStep("scan");
      })
      .catch(() => setStep("error"));
  }, []);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ recoveryCodes: string[] }>("/api/auth/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ methodId, code }),
      });
      setRecoveryCodes(data.recoveryCodes);
      setStep("recovery");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-gold/20 bg-ink-3 p-8">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-gold" size={22} />
            <h1 className="font-display text-xl">Set up admin multi-factor authentication</h1>
          </div>

          {step === "loading" && <p className="text-sm text-mist">Preparing your enrollment…</p>}

          {step === "error" && (
            <p className="text-sm text-danger">
              Couldn&apos;t start MFA enrollment. Refresh the page to try again.
            </p>
          )}

          {step === "scan" && (
            <form onSubmit={handleConfirm} className="space-y-5">
              <p className="text-sm text-ivory-dim">
                Every admin account requires multi-factor authentication before it can access the
                console. Scan this code with an authenticator app (1Password, Authy, Google
                Authenticator).
              </p>
              {qrCodeDataUrl && (
                <div className="flex justify-center rounded-xl bg-ivory p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeDataUrl} alt="MFA enrollment QR code" width={200} height={200} />
                </div>
              )}
              <div className="rounded-xl border border-line bg-ink-2 p-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-mist">Manual entry key</p>
                <p className="mt-1 font-mono text-sm tracking-[0.1em] text-ivory">{manualEntryKey}</p>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">
                  Enter the 6-digit code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-center text-lg tracking-[0.3em] text-ivory focus:border-gold/50 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" size="lg" className="w-full">
                Verify &amp; Enable
              </Button>
            </form>
          )}

          {step === "recovery" && (
            <div className="space-y-5">
              <p className="text-sm text-ivory-dim">
                Save these one-time recovery codes somewhere safe. Each can be used once if you
                lose access to your authenticator app. They will not be shown again.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-ink-2 p-4 font-mono text-sm text-ivory">
                {recoveryCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  setCopied(true);
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy codes"}
              </Button>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  router.push("/admin");
                  router.refresh();
                }}
              >
                Continue to Admin Console
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

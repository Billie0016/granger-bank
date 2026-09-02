"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

export default function CustomerMfaSetupPage() {
  const router = useRouter();
  const [methodId, setMethodId] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<{ methodId: string; qrCodeDataUrl: string; manualEntryKey: string }>("/api/auth/mfa/enroll", {
      method: "POST",
    }).then((data) => {
      setMethodId(data.methodId);
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setManualEntryKey(data.manualEntryKey);
    });
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <PageHeading title="Enable Two-Factor Authentication" subtitle="Protect your account with an authenticator app." />

      <div className="max-w-md rounded-2xl border border-line bg-ink-3 p-8">
        {recoveryCodes ? (
          <div className="space-y-5">
            <p className="text-sm text-ivory-dim">
              Save these recovery codes somewhere safe. Each works once if you lose your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-ink-2 p-4 font-mono text-sm text-ivory">
              {recoveryCodes.map((c) => <span key={c}>{c}</span>)}
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
            <Button size="lg" className="w-full" onClick={() => router.push("/dashboard/security")}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-5">
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
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="6-digit code"
              className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-center text-lg tracking-[0.3em] text-ivory focus:border-gold/50 focus:outline-none"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" className="w-full">Verify &amp; Enable</Button>
          </form>
        )}
      </div>
    </div>
  );
}

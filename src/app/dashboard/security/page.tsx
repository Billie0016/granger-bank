"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, Monitor } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";

type SessionRow = { id: string; isCurrent: boolean; device: string; ipAddress: string; lastSeenAt: string };
type SessionInfo = { user: { mfaEnabled: boolean } };

export default function SecurityPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function load() {
    apiFetch<{ sessions: SessionRow[] }>("/api/auth/sessions").then((d) => setSessions(d.sessions));
    apiFetch<{ user: { mfaEnabled: boolean } }>("/api/auth/session").then((d: SessionInfo) =>
      setMfaEnabled(d.user.mfaEnabled)
    );
  }

  useEffect(load, []);

  async function revoke(id: string) {
    await apiFetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    load();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    try {
      const data = await apiFetch<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <PageHeading title="Security" subtitle="Manage how your account is protected." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-3 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="text-sm text-ivory">Two-Factor Authentication</p>
                <p className="mt-1 text-xs text-mist">
                  {mfaEnabled === null ? "Loading…" : mfaEnabled ? "Enabled via authenticator app." : "Not enabled yet."}
                </p>
              </div>
            </div>
            {mfaEnabled === false && (
              <Button variant="secondary" size="md" onClick={() => router.push("/dashboard/security/mfa-setup")}>
                Enable
              </Button>
            )}
            {mfaEnabled && <Badge tone="positive">On</Badge>}
          </div>

          <form onSubmit={handleChangePassword} className="rounded-2xl border border-line bg-ink-3 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                <KeyRound size={18} />
              </span>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-ivory">Change Password</p>
                <input
                  type="password"
                  required
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-2.5 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
                />
                <input
                  type="password"
                  required
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-2.5 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
                />
                {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
                {passwordMessage && <p className="text-xs text-emerald">{passwordMessage}</p>}
                <Button type="submit" variant="secondary" size="md">Update Password</Button>
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-line bg-ink-3 p-6">
          <p className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mist">
            <Monitor size={14} /> Active Sessions
          </p>
          <div className="space-y-4">
            {sessions === null && <p className="text-sm text-mist">Loading…</p>}
            {sessions?.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-ink-2 px-4 py-3.5">
                <div>
                  <p className="text-sm text-ivory">{s.device}</p>
                  <p className="text-xs text-mist">{s.ipAddress} · {new Date(s.lastSeenAt).toLocaleString()}</p>
                </div>
                {s.isCurrent ? (
                  <Badge tone="positive">This device</Badge>
                ) : (
                  <Button variant="ghost" size="md" onClick={() => revoke(s.id)}>Sign out</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

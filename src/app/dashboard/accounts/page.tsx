"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { formatMinor, getDisplayBalanceMinor } from "@/lib/money";
import type { Account } from "@/lib/types";

const TYPES: { value: Account["type"]; label: string }[] = [
  { value: "CHECKING", label: "Checking" },
  { value: "SAVINGS", label: "Savings" },
  { value: "BUSINESS", label: "Business" },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<Account["type"]>("CHECKING");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    apiFetch<{ accounts: Account[] }>("/api/accounts").then((d) => setAccounts(d.accounts));
  }

  useEffect(load, []);

  async function handleRequestAccount(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ type, currency: "USD", displayName: displayName || `${type} account` }),
      });
      setDisplayName("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeading
        title="Accounts"
        subtitle={accounts ? `${accounts.length} account${accounts.length === 1 ? "" : "s"}` : "Loading…"}
        actions={
          <Button size="md" onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} /> Request New Account
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleRequestAccount} className="mb-6 grid gap-4 rounded-2xl border border-line bg-ink-3 p-6 sm:grid-cols-[1fr_1fr_auto]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Account["type"])}
            className="rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Account nickname (optional)"
            className="rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
          />
          <Button type="submit" size="md" disabled={submitting}>
            {submitting ? "Requesting…" : "Request"}
          </Button>
          {error && <p className="sm:col-span-3 text-sm text-danger">{error}</p>}
        </form>
      )}

      <div className="mb-6 rounded-xl border border-line bg-ink-3 p-4 text-xs leading-relaxed text-mist">
        Requesting an account creates a real record here, but opening it for real requires
        Granger Bank to be connected to a banking provider — accounts stay <Badge tone="gold" className="mx-1">Pending</Badge>
        until then. No balance is shown or invented for an unopened account.
      </div>

      {accounts === null && (
        <div className="grid gap-6 lg:grid-cols-3">
          {[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-ink-3" />)}
        </div>
      )}

      {accounts && accounts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-16 text-center">
          <p className="text-sm text-mist">No accounts yet.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {accounts?.map((acc) => (
          <div
            key={acc.id}
            className="flex flex-col rounded-2xl border border-line bg-gradient-to-b from-ink-3 to-ink-2 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/25"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-mist">{acc.type}</p>
              <Badge tone={acc.status === "ACTIVE" ? "positive" : acc.status === "PENDING" ? "gold" : "negative"}>
                {acc.status}
              </Badge>
            </div>
            <h3 className="mt-2 font-display text-xl text-ivory">{acc.displayName}</h3>
            <p className="mt-1 text-xs text-mist">{acc.maskedNumber ?? "Not yet provisioned"}</p>

            <p className="mt-6 font-display text-3xl tabular-nums text-ivory">
              {formatMinor(getDisplayBalanceMinor(acc), acc.currency)}
            </p>
            <p className="mt-1 text-xs text-mist">
              {acc.cachedAt ? `As of ${new Date(acc.cachedAt).toLocaleString()}` : "No live balance available"}
            </p>

            <div className="mt-6 flex gap-2">
              <Button href="/dashboard/transfers" variant="secondary" size="md" className="flex-1">
                Transfer
              </Button>
              <Button href="/dashboard/transactions" variant="ghost" size="md">
                Details <ArrowUpRight size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

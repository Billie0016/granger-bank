"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import type { Beneficiary } from "@/lib/types";

export default function BeneficiariesPage() {
  const [list, setList] = useState<Beneficiary[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    apiFetch<{ beneficiaries: Beneficiary[] }>("/api/beneficiaries").then((d) => setList(d.beneficiaries));
  }

  useEffect(load, []);

  async function addBeneficiary(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/beneficiaries", {
        method: "POST",
        body: JSON.stringify({ name, bankName, accountNumber }),
      });
      setName("");
      setBankName("");
      setAccountNumber("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/api/beneficiaries/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeading
        title="Beneficiaries"
        subtitle="People and businesses you can send money to."
        actions={
          <Button size="md" onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} /> Add Beneficiary
          </Button>
        }
      />

      <div className="mb-6 rounded-xl border border-line bg-ink-3 p-4 text-xs leading-relaxed text-mist">
        New beneficiaries start <Badge tone="gold" className="mx-1">Pending Verification</Badge> and can&apos;t
        receive transfers until verified — Granger Bank never marks a beneficiary verified on its
        own; that requires a connected banking/payment provider.
      </div>

      {showForm && (
        <form onSubmit={addBeneficiary} className="mb-6 grid gap-4 rounded-2xl border border-line bg-ink-3 p-6 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name or business"
            required
            className="rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
          />
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bank name"
            required
            className="rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
          />
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Account number"
            required
            className="rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none sm:col-span-2"
          />
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <Button type="submit" size="md" disabled={submitting} className="sm:col-span-2">
            {submitting ? "Saving…" : "Save Beneficiary"}
          </Button>
        </form>
      )}

      {list === null && <p className="text-sm text-mist">Loading…</p>}
      {list && list.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-16 text-center">
          <p className="text-sm text-mist">No beneficiaries yet.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list?.map((b) => (
          <div key={b.id} className="rounded-2xl border border-line bg-ink-3 p-6">
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Users size={16} />
              </span>
              <button onClick={() => remove(b.id)} className="text-mist hover:text-danger" aria-label={`Remove ${b.name}`}>
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-4 font-display text-lg text-ivory">{b.name}</p>
            <p className="text-xs text-mist">{b.bankName}</p>
            <Badge tone={b.status === "VERIFIED" ? "positive" : "gold"} className="mt-3">
              {b.status.replace(/_/g, " ")}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

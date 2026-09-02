"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { formatMinor } from "@/lib/money";
import type { Account, Beneficiary, Transaction } from "@/lib/types";

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [result, setResult] = useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<{ accounts: Account[] }>("/api/accounts").then((d) => {
      setAccounts(d.accounts);
      if (d.accounts[0]) setSourceAccountId(d.accounts[0].id);
    });
    apiFetch<{ beneficiaries: Beneficiary[] }>("/api/beneficiaries").then((d) => {
      setBeneficiaries(d.beneficiaries);
      if (d.beneficiaries[0]) setPayeeId(d.beneficiaries[0].id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const amountMinor = Math.round(Number(amount) * 100);
      const data = await apiFetch<{ transaction: Transaction }>("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          sourceAccountId,
          beneficiaryId: payeeId,
          amountMinor,
          currency: "USD",
          reference: memo || "Payment",
        }),
      });
      setResult(data.transaction);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeading title="Payments" subtitle="Send money to a saved payee." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          {result ? (
            <div className="flex flex-col items-center py-8 text-center">
              {result.status === "SETTLED" ? (
                <CheckCircle2 className="text-emerald" size={36} />
              ) : (
                <AlertTriangle className="text-gold" size={36} />
              )}
              <h3 className="mt-5 font-display text-2xl">
                Payment {result.status === "SETTLED" ? "sent" : result.status.replace(/_/g, " ").toLowerCase()}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-mist">
                {formatMinor(result.amountMinor, result.currency)} — {result.reference}
              </p>
              {result.failureReason && (
                <p className="mt-3 max-w-sm rounded-xl border border-line bg-ink-2 p-3 text-xs text-mist">
                  {result.failureReason}
                </p>
              )}
              <Button
                variant="secondary"
                size="md"
                className="mt-8"
                onClick={() => {
                  setResult(null);
                  setAmount("");
                  setMemo("");
                }}
              >
                Send Another Payment
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">Pay from</label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
                >
                  <option value="" disabled>Select an account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">Pay to</label>
                <select
                  value={payeeId}
                  onChange={(e) => setPayeeId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
                >
                  <option value="" disabled>Select a payee</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} — {b.bankName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">Amount</label>
                <div className="flex items-center rounded-xl border border-line bg-ink-2 px-4 py-3 focus-within:border-gold/50">
                  <span className="mr-1 text-mist">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm text-ivory placeholder:text-mist-dim focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">Memo (optional)</label>
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={submitting || !payeeId}>
                <Send size={15} /> {submitting ? "Sending…" : "Send Payment"}
              </Button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-mist">Saved Payees</p>
          {beneficiaries.length === 0 ? (
            <p className="mt-4 text-sm text-mist">
              No payees yet. <a href="/dashboard/beneficiaries" className="text-gold">Add one</a> to send a payment.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {beneficiaries.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-line bg-ink-2 px-4 py-3.5">
                  <div>
                    <p className="text-sm text-ivory">{b.name}</p>
                    <p className="text-xs text-mist">{b.bankName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={b.status === "VERIFIED" ? "positive" : "gold"}>{b.status.replace(/_/g, " ")}</Badge>
                    <Button variant="ghost" size="md" onClick={() => setPayeeId(b.id)}>Select</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

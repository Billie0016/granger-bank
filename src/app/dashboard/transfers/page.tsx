"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { formatMinor, getDisplayBalanceMinor } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { Account, Beneficiary, Transaction } from "@/lib/types";

type Mode = "internal" | "external";

export default function TransfersPage() {
  const [mode, setMode] = useState<Mode>("internal");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadAccounts() {
    apiFetch<{ accounts: Account[] }>("/api/accounts").then((d) => {
      setAccounts(d.accounts);
      const active = d.accounts.filter((a) => a.status === "ACTIVE");
      if (active[0]) setSourceAccountId(active[0].id);
      const otherActive = active.find((a) => a.id !== active[0]?.id);
      if (otherActive) setDestinationAccountId(otherActive.id);
    });
  }

  useEffect(() => {
    loadAccounts();
    apiFetch<{ beneficiaries: Beneficiary[] }>("/api/beneficiaries").then((d) => {
      setBeneficiaries(d.beneficiaries);
      if (d.beneficiaries[0]) setBeneficiaryId(d.beneficiaries[0].id);
    });
  }, []);

  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");
  const destinationOptions = activeAccounts.filter((a) => a.id !== sourceAccountId);

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
          ...(mode === "internal" ? { destinationAccountId } : { beneficiaryId }),
          amountMinor,
          currency: "USD",
          reference: reference || "Transfer",
        }),
      });
      setResult(data.transaction);
      if (mode === "internal") loadAccounts(); // refresh balances shown below
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    mode === "internal" ? !!sourceAccountId && !!destinationAccountId : !!sourceAccountId && !!beneficiaryId;

  return (
    <div>
      <PageHeading title="Transfers" subtitle="Move money between your accounts, or send it to a saved beneficiary." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          {result ? (
            <TransferResult transaction={result} onReset={() => setResult(null)} />
          ) : (
            <>
              <div className="mb-6 flex rounded-xl border border-line bg-ink-2 p-1">
                <ModeTab active={mode === "internal"} onClick={() => setMode("internal")}>
                  Between My Accounts
                </ModeTab>
                <ModeTab active={mode === "external"} onClick={() => setMode("external")}>
                  To a Beneficiary
                </ModeTab>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">From</label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
                  >
                    <option value="" disabled>Select an account</option>
                    {(mode === "internal" ? activeAccounts : accounts).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.displayName} ({a.status}) — {formatMinor(getDisplayBalanceMinor(a), a.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center text-mist">
                  <ArrowLeftRight size={18} />
                </div>

                {mode === "internal" ? (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">To</label>
                    <select
                      value={destinationAccountId}
                      onChange={(e) => setDestinationAccountId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
                    >
                      <option value="" disabled>Select an account</option>
                      {destinationOptions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.displayName} — {formatMinor(getDisplayBalanceMinor(a), a.currency)}
                        </option>
                      ))}
                    </select>
                    {destinationOptions.length === 0 && (
                      <p className="mt-2 text-xs text-mist">
                        You need at least two active accounts to transfer between them.{" "}
                        <a href="/dashboard/accounts" className="text-gold">Request another account</a>.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">To</label>
                    <select
                      value={beneficiaryId}
                      onChange={(e) => setBeneficiaryId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
                    >
                      <option value="" disabled>Select a beneficiary</option>
                      {beneficiaries.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
                      ))}
                    </select>
                    {beneficiaries.length === 0 && (
                      <p className="mt-2 text-xs text-mist">
                        No beneficiaries yet. <a href="/dashboard/beneficiaries" className="text-gold">Add one</a>.
                      </p>
                    )}
                  </div>
                )}

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
                  <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">Reference</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="What's this for?"
                    className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
                  />
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <Button type="submit" size="lg" className="w-full" disabled={submitting || !canSubmit}>
                  {submitting ? "Submitting…" : "Submit Transfer"}
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-ink-3 p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-mist">How this works</p>
          <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
            Every transfer you submit is validated, checked for ownership, and recorded as a real
            transaction with a full audit trail and idempotency protection against duplicates.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
            <span className="text-ivory">Between your own accounts</span>, money never leaves Granger
            Bank — the transfer debits one account and credits the other in a single atomic step and{" "}
            <Badge tone="positive">Settles</Badge> instantly, using the demo&apos;s fake seeded
            balances. A transfer that would overdraw the source account is rejected and marked{" "}
            <Badge tone="negative">Failed</Badge> with no money moved.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
            <span className="text-ivory">To a beneficiary</span>, money would leave Granger Bank
            entirely. Granger Bank isn&apos;t connected to a licensed banking or payment provider in
            this environment, so that transfer will be recorded and then honestly marked{" "}
            <Badge tone="negative">Failed</Badge> at the final step — no money moves, and none is
            ever pretended to move.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-gold/10 text-gold" : "text-ivory-dim hover:text-ivory"
      )}
    >
      {children}
    </button>
  );
}

function TransferResult({ transaction, onReset }: { transaction: Transaction; onReset: () => void }) {
  const settled = transaction.status === "SETTLED";
  return (
    <div className="flex flex-col items-center py-8 text-center">
      {settled ? (
        <CheckCircle2 className="text-emerald" size={36} />
      ) : (
        <AlertTriangle className="text-gold" size={36} />
      )}
      <h3 className="mt-5 font-display text-2xl">
        Transfer {settled ? "settled" : transaction.status.replace(/_/g, " ").toLowerCase()}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-mist">
        {formatMinor(transaction.amountMinor, transaction.currency)} — {transaction.reference}
      </p>
      {transaction.failureReason && (
        <p className="mt-3 max-w-sm rounded-xl border border-line bg-ink-2 p-3 text-xs text-mist">
          {transaction.failureReason}
        </p>
      )}
      <Button variant="secondary" size="md" className="mt-8" onClick={onReset}>
        Make Another Transfer
      </Button>
    </div>
  );
}

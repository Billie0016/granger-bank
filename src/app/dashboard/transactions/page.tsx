"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { apiFetch } from "@/lib/apiClient";
import { formatMinor } from "@/lib/money";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiFetch<{ transactions: Transaction[] }>("/api/transactions").then((d) => setTransactions(d.transactions));
  }, []);

  const filtered = useMemo(
    () => (transactions ?? []).filter((tx) => tx.reference.toLowerCase().includes(query.toLowerCase())),
    [transactions, query]
  );

  return (
    <div>
      <PageHeading title="Transactions" subtitle="Every transaction you've submitted, with full status history." />

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-line bg-ink-3 px-4 py-2.5 sm:w-80">
        <Search size={15} className="text-mist" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by reference"
          className="w-full bg-transparent text-sm text-ivory placeholder:text-mist-dim focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Reference</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions === null && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-mist">Loading…</td>
              </tr>
            )}
            {transactions?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-mist">
                  No transactions yet — submit a transfer or payment to see it here.
                </td>
              </tr>
            )}
            {filtered.map((tx) => (
              <tr key={tx.id} className="border-b border-line last:border-0 hover:bg-ink-4/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.direction === "CREDIT" ? "bg-emerald/10 text-emerald" : "bg-ivory/[0.06] text-ivory-dim"}`}>
                      {tx.direction === "CREDIT" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <p className="text-ivory">{tx.reference}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-ivory-dim">{tx.type.replace(/_/g, " ")}</td>
                <td className="px-6 py-4 text-ivory-dim">{new Date(tx.initiatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Badge tone={tx.status === "SETTLED" ? "positive" : tx.status === "FAILED" || tx.status === "REJECTED" ? "negative" : "gold"}>
                    {tx.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-ivory-dim">
                  {formatMinor(tx.amountMinor, tx.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

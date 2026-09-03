"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { apiFetch } from "@/lib/apiClient";
import { formatMinor } from "@/lib/money";

type AdminTransaction = {
  id: string;
  reference: string;
  status: string;
  amountMinor: string;
  currency: string;
  initiatedAt: string;
  customerProfile: { legalFirstName: string; legalLastName: string };
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[] | null>(null);

  useEffect(() => {
    apiFetch<{ transactions: AdminTransaction[] }>("/api/admin/transactions").then((d) => setTransactions(d.transactions));
  }, []);

  return (
    <div>
      <PageHeading title="Transactions" subtitle="Platform-wide transaction monitoring." />

      <div className="overflow-x-auto rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Reference</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-mist">No transactions yet.</td></tr>
            )}
            {transactions?.map((tx) => (
              <tr key={tx.id} className="border-b border-line last:border-0 hover:bg-ink-4/50">
                <td className="px-6 py-4 text-ivory">{tx.customerProfile.legalFirstName} {tx.customerProfile.legalLastName}</td>
                <td className="px-6 py-4 text-ivory-dim">{tx.reference}</td>
                <td className="px-6 py-4 text-ivory-dim">{new Date(tx.initiatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Badge tone={tx.status === "SETTLED" ? "positive" : tx.status === "FAILED" || tx.status === "REJECTED" ? "negative" : "gold"}>
                    {tx.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-ivory-dim">{formatMinor(tx.amountMinor, tx.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

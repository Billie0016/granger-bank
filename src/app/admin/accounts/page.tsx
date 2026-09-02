"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { apiFetch } from "@/lib/apiClient";
import { formatMinor } from "@/lib/money";

type AdminAccount = {
  id: string;
  type: string;
  displayName: string;
  currency: string;
  status: string;
  cachedBalanceMinor: string | null;
  customerProfile: { legalFirstName: string; legalLastName: string };
};

const statusTone = { ACTIVE: "positive", PENDING: "gold", RESTRICTED: "negative", CLOSED: "neutral" } as const;

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);

  useEffect(() => {
    apiFetch<{ accounts: AdminAccount[] }>("/api/admin/accounts").then((d) => setAccounts(d.accounts));
  }, []);

  return (
    <div>
      <PageHeading title="Accounts" subtitle={accounts ? `${accounts.length} accounts across all customers` : "Loading…"} />

      <div className="overflow-x-auto rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Owner</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts?.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-mist">No accounts yet.</td></tr>
            )}
            {accounts?.map((acc) => (
              <tr key={acc.id} className="border-b border-line last:border-0 hover:bg-ink-4/50">
                <td className="px-6 py-4 text-ivory">{acc.customerProfile.legalFirstName} {acc.customerProfile.legalLastName}</td>
                <td className="px-6 py-4 text-ivory-dim">{acc.type}</td>
                <td className="px-6 py-4">
                  <Badge tone={statusTone[acc.status as keyof typeof statusTone] ?? "neutral"}>{acc.status}</Badge>
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-ivory">
                  {acc.cachedBalanceMinor !== null ? formatMinor(acc.cachedBalanceMinor, acc.currency) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

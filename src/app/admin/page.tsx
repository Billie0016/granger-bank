"use client";

import { useEffect, useState } from "react";
import { Users, Landmark, Receipt, ScrollText } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { apiFetch } from "@/lib/apiClient";

type Customer = { id: string; accounts?: { cachedBalanceMinor: string | null; currency: string }[] };
type AuditLog = { id: string; action: string; targetType: string; createdAt: string; actor?: { email: string } | null };
type Txn = { id: string; status: string };

export default function AdminOverviewPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [transactions, setTransactions] = useState<Txn[] | null>(null);
  const [logs, setLogs] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    apiFetch<{ customers: Customer[] }>("/api/admin/customers").then((d) => setCustomers(d.customers)).catch(() => setCustomers([]));
    apiFetch<{ transactions: Txn[] }>("/api/admin/transactions").then((d) => setTransactions(d.transactions)).catch(() => setTransactions([]));
    apiFetch<{ logs: AuditLog[] }>("/api/admin/audit-logs").then((d) => setLogs(d.logs)).catch(() => setLogs([]));
  }, []);

  const flaggedCount = transactions?.filter((t) => t.status === "PENDING_RISK_REVIEW").length ?? 0;

  return (
    <div>
      <PageHeading title="Admin Overview" subtitle="Institution-wide snapshot — real data, currently sparse in a fresh environment." />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Total Customers" value={customers?.length ?? "—"} icon={Users} />
        <MiniStat label="Total Transactions" value={transactions?.length ?? "—"} icon={Receipt} />
        <MiniStat label="Pending Risk Review" value={flaggedCount} icon={Landmark} />
        <MiniStat label="Audit Events" value={logs?.length ?? "—"} icon={ScrollText} />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-ink-3 p-6 sm:p-8">
        <p className="mb-5 text-xs uppercase tracking-[0.16em] text-mist">Recent Audit Activity</p>
        {logs?.length === 0 && <p className="text-sm text-mist">No audit events yet.</p>}
        <div className="space-y-4">
          {logs?.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
              <div>
                <p className="text-sm text-ivory">{log.action}</p>
                <p className="text-xs text-mist">{log.actor?.email ?? "system"} · {log.targetType}</p>
              </div>
              <span className="text-xs text-mist">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-3 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-mist">{label}</p>
        <Icon size={16} className="text-gold" />
      </div>
      <p className="mt-3 font-display text-3xl tabular-nums text-ivory">{value}</p>
    </div>
  );
}

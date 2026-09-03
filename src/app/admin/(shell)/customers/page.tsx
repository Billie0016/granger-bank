"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { apiFetch } from "@/lib/apiClient";

type Customer = {
  id: string;
  legalFirstName: string;
  legalLastName: string;
  segment: string;
  createdAt: string;
  user: { email: string; status: string };
  kyc?: { status: string } | null;
};

const statusTone = { ACTIVE: "positive", PENDING_VERIFICATION: "gold", SUSPENDED: "negative", CLOSED: "neutral" } as const;

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiFetch<{ customers: Customer[] }>("/api/admin/customers").then((d) => setCustomers(d.customers));
  }, []);

  const filtered = useMemo(
    () =>
      (customers ?? []).filter(
        (c) =>
          `${c.legalFirstName} ${c.legalLastName}`.toLowerCase().includes(query.toLowerCase()) ||
          c.user.email.toLowerCase().includes(query.toLowerCase())
      ),
    [customers, query]
  );

  return (
    <div>
      <PageHeading title="Customers" subtitle={customers ? `${customers.length} total customers` : "Loading…"} />

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-line bg-ink-3 px-4 py-2.5 sm:w-96">
        <Search size={15} className="text-mist" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-transparent text-sm text-ivory placeholder:text-mist-dim focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Segment</th>
              <th className="px-6 py-4 font-medium">KYC Status</th>
              <th className="px-6 py-4 font-medium">Client Since</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers?.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-mist">No customers yet.</td></tr>
            )}
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/admin/customers/${c.id}`)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-ink-4/50"
              >
                <td className="px-6 py-4">
                  <p className="text-ivory">{c.legalFirstName} {c.legalLastName}</p>
                  <p className="text-xs text-mist">{c.user.email}</p>
                </td>
                <td className="px-6 py-4 text-ivory-dim">{c.segment}</td>
                <td className="px-6 py-4">
                  <Badge tone={c.kyc?.status === "APPROVED" ? "positive" : "gold"}>{(c.kyc?.status ?? "NOT_STARTED").replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-6 py-4 text-ivory-dim">{new Date(c.createdAt).getFullYear()}</td>
                <td className="px-6 py-4">
                  <Badge tone={statusTone[c.user.status as keyof typeof statusTone] ?? "neutral"}>{c.user.status.replace(/_/g, " ")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

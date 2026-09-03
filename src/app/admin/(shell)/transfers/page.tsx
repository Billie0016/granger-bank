"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { formatMinor } from "@/lib/money";

type PendingTransfer = {
  id: string;
  reference: string;
  amountMinor: string;
  currency: string;
  customerProfile: { legalFirstName: string; legalLastName: string };
};

export default function AdminTransfersPage() {
  const [pending, setPending] = useState<PendingTransfer[] | null>(null);
  const [error, setError] = useState("");

  function load() {
    apiFetch<{ transactions: PendingTransfer[] }>("/api/admin/transactions?status=PENDING_RISK_REVIEW").then((d) =>
      setPending(d.transactions)
    );
  }

  useEffect(load, []);

  async function review(id: string, decision: "APPROVE" | "REJECT") {
    setError("");
    try {
      await apiFetch(`/api/admin/transfers/${id}/review`, { method: "POST", body: JSON.stringify({ decision }) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <PageHeading title="Transfers" subtitle="Transfers held for risk review." />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {pending?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-16 text-center">
          <p className="text-sm text-mist">Nothing is currently pending risk review.</p>
        </div>
      )}

      <div className="space-y-4">
        {pending?.map((t) => (
          <div key={t.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-ink-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-ivory">{t.reference} — {formatMinor(t.amountMinor, t.currency)}</p>
              <p className="mt-1 text-xs text-mist">{t.customerProfile.legalFirstName} {t.customerProfile.legalLastName}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="gold">Pending Risk Review</Badge>
              <Button variant="secondary" size="md" onClick={() => review(t.id, "APPROVE")}>
                <Check size={14} /> Approve
              </Button>
              <Button variant="ghost" size="md" onClick={() => review(t.id, "REJECT")}>
                <X size={14} /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

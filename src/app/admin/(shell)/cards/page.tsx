"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { apiFetch } from "@/lib/apiClient";

type AdminCard = {
  id: string;
  type: string;
  status: string;
  last4: string | null;
  account: { customerProfile: { legalFirstName: string; legalLastName: string } };
};

export default function AdminCardsPage() {
  const [cards, setCards] = useState<AdminCard[] | null>(null);

  useEffect(() => {
    apiFetch<{ cards: AdminCard[] }>("/api/admin/cards").then((d) => setCards(d.cards));
  }, []);

  return (
    <div>
      <PageHeading title="Cards" subtitle="Card issuance status across all customers." />

      <div className="overflow-x-auto rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Cardholder</th>
              <th className="px-6 py-4 font-medium">Card</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {cards?.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-mist">No cards have been requested yet.</td></tr>
            )}
            {cards?.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-ink-4/50">
                <td className="px-6 py-4 text-ivory">
                  {c.account.customerProfile.legalFirstName} {c.account.customerProfile.legalLastName}
                </td>
                <td className="px-6 py-4 font-mono text-ivory-dim tracking-[0.15em]">
                  {c.last4 ? `•••• ${c.last4}` : "Not yet issued"}
                </td>
                <td className="px-6 py-4 text-ivory-dim">{c.type}</td>
                <td className="px-6 py-4">
                  <Badge tone={c.status === "ACTIVE" ? "positive" : c.status === "FROZEN" ? "gold" : "neutral"}>
                    {c.status.replace(/_/g, " ")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

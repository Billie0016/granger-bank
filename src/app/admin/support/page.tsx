"use client";

import { useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";

const statusOptions = ["Open", "In Progress", "Resolved"] as const;

/**
 * There is no SupportTicket model in the production schema yet (see
 * docs/production/03-database-schema.md) — a real support/ticketing
 * system is out of scope for Phases 1–7. This UI is illustrative of the
 * intended admin experience, backed by local-only state, not persisted or
 * customer-linked data. It contains no financial figures.
 */
const illustrativeTickets = [
  { id: "tic_1", customer: "Sana Ibrahim", subject: "Unrecognized international withdrawal", priority: "High", status: "Open", updated: "2h ago" },
  { id: "tic_2", customer: "Fenwick LLC", subject: "Wire transfer delayed", priority: "High", status: "In Progress", updated: "5h ago" },
  { id: "tic_3", customer: "Priya Anand", subject: "Update mailing address", priority: "Low", status: "Open", updated: "1d ago" },
  { id: "tic_4", customer: "Jordan Reyes", subject: "Card not working abroad", priority: "Medium", status: "Resolved", updated: "2d ago" },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState(illustrativeTickets);

  return (
    <div>
      <PageHeading title="Support" subtitle={`${tickets.filter((t) => t.status !== "Resolved").length} open tickets (illustrative — no ticketing backend yet)`} />

      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-2xl border border-line bg-ink-3 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-ivory">{t.subject}</p>
                <p className="mt-1 text-xs text-mist">{t.customer} · Updated {t.updated}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={t.priority === "High" ? "negative" : t.priority === "Medium" ? "gold" : "neutral"}>
                  {t.priority} Priority
                </Badge>
                <select
                  value={t.status}
                  onChange={(e) =>
                    setTickets((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, status: e.target.value } : x))
                    )
                  }
                  className="rounded-full border border-line-strong bg-ink-2 px-3 py-1.5 text-xs text-ivory focus:border-gold/50 focus:outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";

const items = [
  { id: "1", icon: ShieldAlert, title: "High-risk transaction flagged", detail: "$42,000 international wire from Fenwick LLC requires manual approval.", time: "12m ago", tone: "negative" as const },
  { id: "2", icon: AlertTriangle, title: "Login anomaly detected", detail: "Sana Ibrahim signed in from a new location: Lagos, NG.", time: "3h ago", tone: "gold" as const },
  { id: "3", icon: Info, title: "New customer onboarded", detail: "Marlowe & Co. completed business verification.", time: "1d ago", tone: "neutral" as const },
  { id: "4", icon: Info, title: "Nightly reconciliation complete", detail: "All ledgers balanced with zero discrepancies.", time: "1d ago", tone: "positive" as const },
];

export default function AdminNotificationsPage() {
  return (
    <div>
      <PageHeading title="Notifications" subtitle="System and compliance alerts across the platform." />

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-3">
        {items.map((n) => (
          <div key={n.id} className="flex items-start gap-4 px-6 py-5">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <n.icon size={15} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-ivory">{n.title}</p>
                <Badge tone={n.tone}>{n.tone === "negative" ? "Critical" : n.tone === "gold" ? "Warning" : n.tone === "positive" ? "Resolved" : "Info"}</Badge>
              </div>
              <p className="mt-1 text-sm text-mist">{n.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-mist">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

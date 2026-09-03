"use client";

import { useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";

const admins = [
  { name: "M. Whitfield", email: "m.whitfield@grangerbank.example", role: "Super Admin" },
  { name: "A. Chen", email: "a.chen@grangerbank.example", role: "Fraud & Risk" },
  { name: "R. Osei", email: "r.osei@grangerbank.example", role: "Compliance" },
];

export default function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [strictFraud, setStrictFraud] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div>
      <PageHeading title="Settings" subtitle="Platform configuration for the Granger Bank admin console." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Toggle
            label="Maintenance Mode"
            detail="Temporarily disable customer sign-ins for scheduled maintenance."
            checked={maintenance}
            onChange={setMaintenance}
          />
          <Toggle
            label="Strict Fraud Sensitivity"
            detail="Flag transactions with elevated scrutiny thresholds."
            checked={strictFraud}
            onChange={setStrictFraud}
          />
          <Toggle
            label="Email Alerts for Critical Events"
            detail="Notify the admin distribution list for high-severity audit events."
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
        </div>

        <div className="rounded-2xl border border-line bg-ink-3 p-6">
          <p className="mb-5 text-xs uppercase tracking-[0.16em] text-mist">Admin Team</p>
          <div className="space-y-4">
            {admins.map((a) => (
              <div key={a.email} className="flex items-center justify-between rounded-xl border border-line bg-ink-2 px-4 py-3.5">
                <div>
                  <p className="text-sm text-ivory">{a.name}</p>
                  <p className="text-xs text-mist">{a.email}</p>
                </div>
                <Badge tone="gold">{a.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-3 p-6">
      <div className="pr-6">
        <p className="text-sm text-ivory">{label}</p>
        <p className="mt-1 text-xs text-mist">{detail}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-gold" : "bg-ink-5"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

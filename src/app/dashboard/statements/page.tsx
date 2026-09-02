"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { apiFetch } from "@/lib/apiClient";

type Statement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "GENERATING" | "READY" | "FAILED";
  account: { displayName: string };
};

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[] | null>(null);

  useEffect(() => {
    apiFetch<{ statements: Statement[] }>("/api/statements").then((d) => setStatements(d.statements));
  }, []);

  return (
    <div>
      <PageHeading title="Statements" subtitle="Monthly statements for your accounts." />

      <div className="rounded-2xl border border-line bg-ink-3 p-8">
        {statements === null && <p className="text-sm text-mist">Loading…</p>}
        {statements?.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="text-mist" size={28} />
            <p className="mt-4 text-sm text-mist">
              No statements have been generated yet. Statements are produced from real transaction
              history on a monthly schedule once your accounts are active.
            </p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statements?.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-ink-2 px-4 py-3.5 text-sm text-ivory-dim">
              <span className="flex items-center gap-2.5">
                <FileText size={15} className="text-gold" />
                {s.account.displayName} — {new Date(s.periodStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

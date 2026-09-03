"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { apiFetch } from "@/lib/apiClient";

type AuditLog = {
  id: string;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  actor: { email: string } | null;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    apiFetch<{ logs: AuditLog[] }>("/api/admin/audit-logs").then((d) => setLogs(d.logs));
  }, []);

  return (
    <div>
      <PageHeading title="Audit Logs" subtitle="Immutable record of system and administrator actions." />

      <div className="overflow-x-auto rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {logs?.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-mist">No audit events recorded yet.</td></tr>
            )}
            {logs?.map((log) => (
              <tr key={log.id} className="border-b border-line last:border-0 hover:bg-ink-4/50">
                <td className="px-6 py-4 font-mono text-xs text-ivory-dim">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 text-ivory-dim">{log.actor?.email ?? "system"}</td>
                <td className="px-6 py-4 text-ivory">{log.action}</td>
                <td className="px-6 py-4 text-ivory-dim">{log.targetType} · {log.targetId.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

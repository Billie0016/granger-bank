"use client";

import { useEffect, useState } from "react";
import { Bell, CircleDot } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiClient";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const [list, setList] = useState<Notification[] | null>(null);

  function load() {
    apiFetch<{ notifications: Notification[] }>("/api/notifications").then((d) => setList(d.notifications));
  }

  useEffect(load, []);

  async function markRead(id: string) {
    await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
    load();
  }

  async function markAllRead() {
    await apiFetch("/api/notifications/read-all", { method: "POST" });
    load();
  }

  const unreadCount = list?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div>
      <PageHeading
        title="Notifications"
        subtitle={list ? `${unreadCount} unread` : "Loading…"}
        actions={
          <Button variant="secondary" size="md" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        }
      />

      {list?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-16 text-center">
          <p className="text-sm text-mist">No notifications yet.</p>
        </div>
      )}

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-3">
        {list?.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-ink-4/50"
          >
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Bell size={15} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-ivory">{n.title}</p>
                {!n.readAt && <CircleDot size={8} className="text-gold" />}
              </div>
              <p className="mt-1 text-sm text-mist">{n.body}</p>
            </div>
            <span className="shrink-0 text-xs text-mist">{new Date(n.createdAt).toLocaleDateString()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

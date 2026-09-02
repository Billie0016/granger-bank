"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, Plus } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { StaticCardFallback } from "@/components/three/StaticCardFallback";
import { apiFetch, ApiError } from "@/lib/apiClient";
import type { Account, Card } from "@/lib/types";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    apiFetch<{ cards: Card[] }>("/api/cards").then((d) => setCards(d.cards));
    apiFetch<{ accounts: Account[] }>("/api/accounts").then((d) => setAccounts(d.accounts));
  }

  useEffect(load, []);

  async function toggleFreeze(card: Card) {
    setBusyId(card.id);
    setError("");
    try {
      const action = card.status === "FROZEN" ? "unfreeze" : "freeze";
      await apiFetch(`/api/cards/${card.id}/${action}`, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function requestCard() {
    if (!accounts[0]) return;
    setError("");
    try {
      await apiFetch("/api/cards", {
        method: "POST",
        body: JSON.stringify({ accountId: accounts[0].id, type: "DEBIT" }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <PageHeading
        title="Cards"
        subtitle="Manage your Granger Bank cards."
        actions={
          <Button size="md" onClick={requestCard} disabled={accounts.length === 0}>
            <Plus size={15} /> Request a Card
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gold/15 bg-gradient-to-br from-ink-4 to-ink-2 p-7">
          <StaticCardFallback className="mx-auto" />
          <p className="mt-4 text-center text-xs uppercase tracking-[0.14em] text-mist">
            Design preview — not tied to a specific issued card
          </p>
        </div>

        <div className="space-y-4">
          {cards === null && [0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-ink-3" />)}

          {cards && cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line-strong px-4 py-16 text-center">
              <p className="text-sm text-mist">
                No cards yet. Request one above — issuance requires a connected card provider,
                so it will stay <Badge tone="gold" className="mx-1">Pending Issuance</Badge> in this environment.
              </p>
            </div>
          )}

          {cards?.map((card) => (
            <div key={card.id} className="rounded-2xl border border-line bg-ink-3 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg text-ivory">Granger {card.type}</p>
                  <p className="mt-1 font-mono text-sm tracking-[0.2em] text-ivory-dim">
                    {card.last4 ? `•••• ${card.last4}` : "Not yet issued"}
                  </p>
                </div>
                <Badge tone={card.status === "ACTIVE" ? "positive" : card.status === "FROZEN" ? "gold" : "neutral"}>
                  {card.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={!card.last4 || busyId === card.id}
                  onClick={() => toggleFreeze(card)}
                >
                  {card.status === "FROZEN" ? <Unlock size={15} /> : <Lock size={15} />}
                  {card.status === "FROZEN" ? "Unfreeze" : "Freeze Card"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  Send,
  ArrowLeftRight,
  Plus,
  Clock,
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiClient";
import { formatMinor } from "@/lib/money";
import type { Account, Transaction } from "@/lib/types";

export default function DashboardOverviewPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    apiFetch<{ accounts: Account[] }>("/api/accounts").then((d) => setAccounts(d.accounts));
    apiFetch<{ transactions: Transaction[] }>("/api/transactions").then((d) => setTransactions(d.transactions));
  }, []);

  const hasLiveBalance = accounts?.some((a) => a.cachedBalanceMinor !== null);

  return (
    <div>
      <PageHeading
        title="Overview"
        subtitle="Here's where things stand today."
        actions={
          <>
            <Button href="/dashboard/transfers" variant="secondary" size="md">
              <ArrowLeftRight size={15} /> Transfer
            </Button>
            <Button href="/dashboard/payments" size="md">
              <Send size={15} /> Pay
            </Button>
          </>
        }
      />

      {!hasLiveBalance && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/[0.06] p-4">
          <Clock size={18} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm leading-relaxed text-ivory-dim">
            Live balances aren&apos;t available yet — Granger Bank isn&apos;t connected to a
            banking provider in this environment, so no account balance is fabricated
            here. See <span className="text-gold">docs/production</span> for the integration plan.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-ink-3 p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-mist">Your Accounts</p>
          <Landmark size={16} className="text-gold" />
        </div>

        {accounts === null && <SkeletonRows count={2} />}

        {accounts && accounts.length === 0 && (
          <EmptyState
            message="You haven't requested an account yet."
            actionLabel="Request an account"
            href="/dashboard/accounts"
          />
        )}

        {accounts && accounts.length > 0 && (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-xl border border-line bg-ink-2 px-4 py-3.5">
                <div>
                  <p className="text-sm text-ivory">{acc.displayName}</p>
                  <p className="text-xs text-mist">{acc.maskedNumber ?? "Not yet provisioned"}</p>
                </div>
                <div className="text-right">
                  {acc.cachedBalanceMinor !== null ? (
                    <p className="font-display text-lg tabular-nums text-ivory">
                      {formatMinor(acc.cachedBalanceMinor, acc.currency)}
                    </p>
                  ) : (
                    <Badge tone="gold">{acc.status === "PENDING" ? "Pending" : "Balance unavailable"}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button href="/dashboard/accounts" variant="ghost" size="md" className="mt-4">
          <Plus size={15} /> Manage accounts
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-ink-3 p-6 sm:p-8">
        <p className="mb-5 text-xs uppercase tracking-[0.16em] text-mist">Recent Transactions</p>

        {transactions === null && <SkeletonRows count={3} />}

        {transactions && transactions.length === 0 && (
          <EmptyState message="No transactions yet." actionLabel="Make a transfer" href="/dashboard/transfers" />
        )}

        {transactions && transactions.length > 0 && (
          <div className="space-y-1">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg px-1 py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      tx.direction === "CREDIT" ? "bg-emerald/10 text-emerald" : "bg-ivory/[0.06] text-ivory-dim"
                    }`}
                  >
                    {tx.direction === "CREDIT" ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <div>
                    <p className="text-sm text-ivory">{tx.reference}</p>
                    <p className="text-xs text-mist">{new Date(tx.initiatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums text-ivory-dim">{formatMinor(tx.amountMinor, tx.currency)}</p>
                  <Badge tone={statusTone(tx.status)} className="mt-1">
                    {tx.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button href="/dashboard/transactions" variant="ghost" size="md" className="mt-4">
          View all transactions
        </Button>
      </div>
    </div>
  );
}

function statusTone(status: Transaction["status"]) {
  if (status === "SETTLED") return "positive" as const;
  if (status === "FAILED" || status === "REJECTED") return "negative" as const;
  return "gold" as const;
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-ink-2" />
      ))}
    </div>
  );
}

function EmptyState({ message, actionLabel, href }: { message: string; actionLabel: string; href: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center">
      <p className="text-sm text-mist">{message}</p>
      <Button href={href} variant="secondary" size="md" className="mt-4">
        {actionLabel}
      </Button>
    </div>
  );
}

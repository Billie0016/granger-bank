"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, CreditCard } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import {
  illustrativeAccounts as accounts,
  illustrativeTransactions as transactions,
  illustrativeTotalBalance as totalBalance,
  formatIllustrativeCurrency as formatCurrency,
} from "@/lib/marketingIllustrativeData";

export function DashboardPreview() {
  return (
    <section className="py-28">
      <Container>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Digital Banking</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance sm:text-5xl">
              Look inside the Granger Bank platform.
            </h2>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mist">
              Illustrative preview — not a real account
            </p>
          </div>
          <Button href="/login" variant="secondary" size="md" className="shrink-0">
            Explore the Dashboard
          </Button>
        </Reveal>

        <Reveal delay={0.15} className="mt-16">
          <motion.div
            initial={{ rotateX: 4, rotateY: -4 }}
            whileInView={{ rotateX: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 1600 }}
            className="overflow-hidden rounded-2xl border border-line bg-ink-3 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-2 border-b border-line bg-ink-2 px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ivory/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-ivory/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-ivory/15" />
              <span className="ml-4 text-xs text-mist">Granger Bank · Digital Banking</span>
            </div>

            <div className="grid gap-px bg-line md:grid-cols-[1.2fr_1fr]">
              <div className="bg-ink-3 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-mist">Total Balance</p>
                    <p className="mt-2 font-display text-3xl tabular-nums text-ivory">
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs text-emerald">
                    +12.8%
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="rounded-xl border border-line bg-ink-2 p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-mist">{acc.type}</p>
                      <p className="mt-2 font-display text-lg tabular-nums text-ivory">
                        {formatCurrency(acc.balance)}
                      </p>
                      <p className="mt-1 text-[11px] text-mist">{acc.number}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-mist">Recent Transactions</p>
                  <div className="mt-4 space-y-3">
                    {transactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              tx.amount > 0 ? "bg-emerald/10 text-emerald" : "bg-ivory/[0.06] text-ivory-dim"
                            }`}
                          >
                            {tx.amount > 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                          </span>
                          <div>
                            <p className="text-ivory">{tx.merchant}</p>
                            <p className="text-[11px] text-mist">{tx.category}</p>
                          </div>
                        </div>
                        <p className={`tabular-nums ${tx.amount > 0 ? "text-emerald" : "text-ivory-dim"}`}>
                          {tx.amount > 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(tx.amount)).replace("$", "$")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-px bg-line">
                <div className="flex-1 bg-ink-3 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-mist">Cards</p>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl bg-gradient-to-br from-ink-4 to-ink-2 border border-gold/20 p-4">
                      <div className="flex items-center justify-between">
                        <CreditCard size={20} className="text-gold" />
                        <span className="text-[10px] uppercase tracking-[0.12em] text-emerald">Active</span>
                      </div>
                      <p className="mt-4 font-mono text-sm tracking-[0.2em] text-ivory-dim">•••• 4827</p>
                      <p className="mt-1 text-[11px] text-mist">Granger Debit</p>
                    </div>
                    <div className="rounded-xl bg-ink-2 border border-line p-4">
                      <div className="flex items-center justify-between">
                        <CreditCard size={20} className="text-ivory-dim" />
                        <span className="text-[10px] uppercase tracking-[0.12em] text-emerald">Active</span>
                      </div>
                      <p className="mt-4 font-mono text-sm tracking-[0.2em] text-ivory-dim">•••• 1093</p>
                      <p className="mt-1 text-[11px] text-mist">Granger Credit</p>
                    </div>
                  </div>
                </div>

                <div className="bg-ink-3 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-mist">Spending Analytics</p>
                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Housing", pct: 34 },
                      { label: "Travel", pct: 22 },
                      { label: "Dining", pct: 16 },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex justify-between text-xs text-mist">
                          <span>{row.label}</span>
                          <span>{row.pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-4">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-gold-3 to-gold"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </Container>
    </section>
  );
}

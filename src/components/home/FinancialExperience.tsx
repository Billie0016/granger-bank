"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  illustrativeTotalBalance as totalBalance,
  illustrativeMonthlySpending as monthlySpending,
  illustrativeSavingsGrowthPct as savingsGrowthPct,
  illustrativeSpendingByMonth as spendingByMonth,
} from "@/lib/marketingIllustrativeData";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-ink-3 px-4 py-3 text-xs shadow-xl">
      <p className="mb-1.5 text-mist">{label} 2026</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-ivory">
          {p.dataKey === "spending" ? "Spending" : "Savings"}:{" "}
          <span className="font-medium">${p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function FinancialExperience() {
  return (
    <section className="border-y border-line bg-ink-2/60 py-28">
      <Container>
        <Reveal>
          <SectionLabel>Financial Experience</SectionLabel>
          <h2 className="mt-6 max-w-2xl font-display text-4xl leading-tight text-balance sm:text-5xl">
            A clear view of where you stand.
          </h2>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mist">
            Illustrative example — not a real account
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal delay={0.1} className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-line bg-ink-3 p-7">
              <p className="text-xs uppercase tracking-[0.16em] text-mist">Total Balance</p>
              <AnimatedNumber
                value={totalBalance}
                prefix="$"
                className="mt-3 block font-display text-4xl tabular-nums text-ivory"
              />
              <p className="mt-2 text-sm text-emerald">Across 3 accounts</p>
            </div>
            <div className="rounded-2xl border border-line bg-ink-3 p-7">
              <p className="text-xs uppercase tracking-[0.16em] text-mist">Monthly Spending</p>
              <AnimatedNumber
                value={monthlySpending}
                prefix="$"
                className="mt-3 block font-display text-4xl tabular-nums text-ivory"
              />
              <p className="mt-2 text-sm text-mist">vs. $6,120 last month</p>
            </div>
            <div className="rounded-2xl border border-line bg-ink-3 p-7">
              <p className="text-xs uppercase tracking-[0.16em] text-mist">Savings Growth</p>
              <AnimatedNumber
                value={savingsGrowthPct}
                prefix="+"
                suffix="%"
                decimals={1}
                className="mt-3 block font-display text-4xl tabular-nums text-gold"
              />
              <p className="mt-2 text-sm text-mist">Year over year</p>
            </div>
          </Reveal>

          <Reveal delay={0.2} className="rounded-2xl border border-line bg-ink-3 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-6 text-xs uppercase tracking-[0.14em] text-mist">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold" /> Savings
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ivory-dim" /> Spending
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a458" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#c9a458" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd0d8" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#cbd0d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8a91a0", fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#c9a458", strokeOpacity: 0.2 }} />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="#cbd0d8"
                    strokeWidth={2}
                    fill="url(#spendingFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#c9a458"
                    strokeWidth={2.5}
                    fill="url(#savingsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Building2, Users2, Zap, ShieldCheck, LineChart, Receipt } from "lucide-react";

export const metadata: Metadata = {
  title: "Business Banking — Granger Bank",
};

const tools = [
  { icon: Zap, title: "Same-Day Transfers", detail: "Same-day ACH and domestic wires with transparent, published pricing." },
  { icon: Users2, title: "Team Cards & Controls", detail: "Issue cards instantly with per-employee limits, categories and approval flows." },
  { icon: LineChart, title: "Cash Flow Insights", detail: "Forecast runway and spot spending trends before they become problems." },
  { icon: Receipt, title: "Effortless Bookkeeping", detail: "Sync transactions directly to your accounting stack — no CSV exports." },
  { icon: ShieldCheck, title: "Layered Fraud Controls", detail: "Dual-approval workflows and anomaly detection on every outbound payment." },
  { icon: Building2, title: "Dedicated Advisor", detail: "A named relationship manager who already knows your business." },
];

export default function BusinessBankingPage() {
  return (
    <>
      <PageHero
        eyebrow="Business Banking"
        title="Operating infrastructure for businesses that plan to last."
        description="From your first business checking account to multi-entity treasury management — banking that scales at the pace you grow."
      >
        <div className="mt-9 flex gap-4">
          <Button href="/register" size="lg">Open a Business Account</Button>
          <Button href="/contact" variant="secondary" size="lg">Talk to an Advisor</Button>
        </div>
      </PageHero>

      <section className="py-24">
        <Container>
          <Reveal>
            <SectionLabel>Built For Operators</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance">
              Every tool a growing business actually needs.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <Reveal key={tool.title} delay={i * 0.06} className="h-full">
                <div className="h-full bg-ink-3 p-8 transition-colors hover:bg-ink-4">
                  <tool.icon className="text-gold" size={24} strokeWidth={1.5} />
                  <h3 className="mt-5 font-display text-lg">{tool.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist">{tool.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-ink-2/60 py-24">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionLabel>Business Operating Account</SectionLabel>
            <h2 className="mt-6 font-display text-3xl leading-tight sm:text-4xl">
              One account. Every entity. Full visibility.
            </h2>
            <p className="mt-5 leading-relaxed text-ivory-dim">
              Manage multiple entities, subsidiaries and project accounts from
              a single login — with permissions that map to how your finance
              team actually works.
            </p>
            <Button href="/register" size="lg" className="mt-8">
              Open a Business Account
            </Button>
          </Reveal>
          <Reveal delay={0.1} className="rounded-2xl border border-line bg-ink-3 p-8">
            <p className="text-xs uppercase tracking-[0.16em] text-mist">Business Operating</p>
            <p className="mt-3 font-display text-4xl tabular-nums">$4,000.00</p>
            <div className="mt-8 space-y-4">
              {[
                { label: "Client Retainer — Fenwick LLC", amount: "+$5,200.00" },
                { label: "Marlowe & Co. Design", amount: "-$2,400.00" },
                { label: "Payroll — 4 team members", amount: "-$18,600.00" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-line pb-4 text-sm last:border-0">
                  <span className="text-ivory-dim">{row.label}</span>
                  <span className={row.amount.startsWith("+") ? "text-emerald" : "text-ivory-dim"}>
                    {row.amount}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}

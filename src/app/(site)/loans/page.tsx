import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Home, Car, User, Building2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Loans — Granger Bank",
};

const loans = [
  {
    icon: Home,
    name: "Home Mortgage",
    rate: "From 5.85% APR",
    detail: "Fixed and adjustable-rate mortgages with in-house underwriting and a dedicated loan officer from application to close.",
  },
  {
    icon: Car,
    name: "Auto Loan",
    rate: "From 4.99% APR",
    detail: "Financing for new and pre-owned vehicles, with same-day pre-approval and no prepayment penalties.",
  },
  {
    icon: User,
    name: "Personal Loan",
    rate: "From 6.49% APR",
    detail: "Fixed-rate personal loans up to $75,000 for debt consolidation, renovation or major purchases.",
  },
  {
    icon: Building2,
    name: "Business Line of Credit",
    rate: "From 7.25% APR",
    detail: "Revolving credit lines up to $2M, sized to your business cash flow with flexible draw terms.",
  },
];

export default function LoansPage() {
  return (
    <>
      <PageHero
        eyebrow="Loans & Credit"
        title="Financing that fits your plan — not a generic rate sheet."
        description="Transparent pricing, human underwriting, and decisions in days, not weeks."
      >
        <div className="mt-9 flex gap-4">
          <Button href="/register" size="lg">Check Your Rate</Button>
          <Button href="/contact" variant="secondary" size="lg">Speak to a Lending Advisor</Button>
        </div>
      </PageHero>

      <section className="py-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            {loans.map((loan, i) => (
              <Reveal key={loan.name} delay={i * 0.08}>
                <div className="group flex h-full flex-col rounded-2xl border border-line bg-ink-3 p-9 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30">
                  <div className="flex items-start justify-between">
                    <loan.icon className="text-gold" size={30} strokeWidth={1.5} />
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
                      {loan.rate}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl">{loan.name}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-ivory-dim">{loan.detail}</p>
                  <Button href="/login" variant="secondary" size="md" className="mt-8 w-fit">
                    Get Started <ArrowRight size={15} />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-ink-2/60 py-24">
        <Container>
          <Reveal>
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance">
              From application to funding in three steps.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { step: "01", title: "Apply online", detail: "Tell us about your goals in a five-minute application — no paperwork required." },
              { step: "02", title: "Meet your advisor", detail: "A dedicated lending advisor reviews your options and answers every question." },
              { step: "03", title: "Get funded", detail: "Once approved, funds are disbursed directly to your Granger Bank account." },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.1}>
                <p className="font-display text-4xl text-gold/50">{s.step}</p>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{s.detail}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}

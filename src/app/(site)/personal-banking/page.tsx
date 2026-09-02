import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Wallet, PiggyBank, TrendingUp, Smartphone, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Personal Banking — Granger Bank",
};

const tiers = [
  {
    icon: Wallet,
    name: "Everyday Checking",
    price: "$0/mo",
    features: [
      "No monthly maintenance fees",
      "Early direct deposit access",
      "Fee-free at 55,000+ ATMs worldwide",
      "Real-time spending notifications",
    ],
  },
  {
    icon: PiggyBank,
    name: "High-Yield Savings",
    price: "4.35% APY",
    features: [
      "Rate applies to every dollar saved",
      "Unlimited goal-based sub-accounts",
      "Automated round-up transfers",
      "No minimum balance requirement",
    ],
    highlighted: true,
  },
  {
    icon: TrendingUp,
    name: "Private Wealth",
    price: "By invitation",
    features: [
      "Dedicated relationship manager",
      "Preferred lending rates",
      "Estate & trust coordination",
      "Priority 24/7 concierge line",
    ],
  },
];

const features = [
  {
    icon: Smartphone,
    title: "A banking app worth opening",
    detail: "Real-time balances, instant transfers and spending insights, designed with the same rigor as our security systems.",
  },
  {
    icon: TrendingUp,
    title: "Savings that compound quietly",
    detail: "Automated rules move money exactly when you want it moved — no spreadsheets required.",
  },
];

export default function PersonalBankingPage() {
  return (
    <>
      <PageHero
        eyebrow="Personal Banking"
        title="Everyday banking, held to a private-bank standard."
        description="Checking, savings and wealth accounts built around how you actually spend, save and plan — not around what's easiest for a bank to sell."
      >
        <div className="mt-9 flex gap-4">
          <Button href="/register" size="lg">Open an Account</Button>
          <Button href="/cards" variant="secondary" size="lg">View Cards</Button>
        </div>
      </PageHero>

      <section className="py-24">
        <Container>
          <Reveal>
            <SectionLabel>Accounts</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance">
              Choose the account that matches how you bank.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 0.1}>
                <div
                  className={`flex h-full flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                    tier.highlighted
                      ? "border-gold/40 bg-gradient-to-b from-ink-4 to-ink-2 shadow-[0_30px_60px_-28px_rgba(201,164,88,0.35)]"
                      : "border-line bg-ink-3"
                  }`}
                >
                  <tier.icon className="text-gold" size={26} strokeWidth={1.5} />
                  <h3 className="mt-6 font-display text-2xl">{tier.name}</h3>
                  <p className="mt-2 font-display text-lg text-gold">{tier.price}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-ivory-dim">
                        <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button href="/register" variant={tier.highlighted ? "primary" : "secondary"} size="md" className="mt-8 w-full">
                    Get Started
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-ink-2/60 py-24">
        <Container className="grid gap-10 lg:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1} className="rounded-2xl border border-line bg-ink-3 p-9">
              <f.icon className="text-gold" size={28} strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-2xl">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-ivory-dim">{f.detail}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}

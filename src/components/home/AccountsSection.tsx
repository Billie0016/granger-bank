import { Wallet, PiggyBank, Building2, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

const products = [
  {
    icon: Wallet,
    name: "Everyday Checking",
    tagline: "For the way you move money daily",
    benefits: ["No monthly fees with direct deposit", "Early paycheck access", "Global fee-free spending"],
  },
  {
    icon: PiggyBank,
    name: "Savings",
    tagline: "Let your balance work harder",
    benefits: ["4.35% APY on all balances", "Automated round-up saving", "Goal-based sub-accounts"],
  },
  {
    icon: Building2,
    name: "Business Banking",
    tagline: "Built for founders and operators",
    benefits: ["Same-day ACH & wires", "Team cards with spend controls", "Dedicated business advisor"],
  },
];

export function AccountsSection() {
  return (
    <section className="py-28">
      <Container>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Accounts</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance sm:text-5xl">
              Products designed to move with your life.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {products.map((product, i) => (
            <Reveal key={product.name} delay={i * 0.1}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-ink-3 to-ink-2 p-8 transition-all duration-400 hover:-translate-y-1.5 hover:border-gold/30 hover:shadow-[0_30px_60px_-24px_rgba(0,0,0,0.6)]">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.06] blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
                <product.icon className="text-gold" size={28} strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-2xl text-ivory">{product.name}</h3>
                <p className="mt-2 text-sm text-mist">{product.tagline}</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {product.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-sm text-ivory-dim">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button href="/register" variant="secondary" size="md" className="mt-8 w-full">
                  Get Started
                  <ArrowUpRight size={15} />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

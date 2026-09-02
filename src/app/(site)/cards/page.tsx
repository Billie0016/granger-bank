import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { FinalCTA } from "@/components/home/FinalCTA";
import { CardShowcase } from "@/components/three/CardShowcase";
import { ShieldCheck, Wifi, Globe2, Sparkles as SparklesIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Cards — Granger Bank",
};

const features = [
  { icon: Wifi, title: "Tap to Pay", detail: "Contactless payments accepted everywhere, secured by tokenized transactions." },
  { icon: ShieldCheck, title: "Instant Freeze", detail: "Lock your card in one tap from the app if it's ever lost or misplaced." },
  { icon: Globe2, title: "No Foreign Fees", detail: "Spend anywhere in the world without currency conversion charges." },
  { icon: SparklesIcon, title: "Premium Rewards", detail: "Earn accelerated rewards on travel, dining and everyday essentials." },
];

const lineup = [
  { name: "Granger Debit", desc: "Everyday spending, linked directly to your checking account.", tag: "Included" },
  { name: "Granger Credit", desc: "Premium rewards card with a 25,000 point welcome offer.", tag: "From $0/yr" },
  { name: "Granger Private", desc: "Invitation-only metal card with concierge and airport lounge access.", tag: "By invitation" },
];

export default function CardsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line py-24 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/3 h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-[130px]" />
        </div>
        <Container className="relative text-center">
          <Reveal>
            <SectionLabel className="justify-center">Granger Cards</SectionLabel>
            <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl leading-tight text-balance sm:text-6xl">
              Designed for the way you bank.
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ivory-dim">
              A card that feels as considered as the account behind it —
              precision-milled details, tap-to-pay, and bank-grade security
              in your pocket.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-16">
            <CardShowcase />
          </Reveal>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08} className="h-full">
                <div className="h-full bg-ink-3 p-8">
                  <f.icon className="text-gold" size={24} strokeWidth={1.5} />
                  <h3 className="mt-5 font-display text-lg">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist">{f.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-ink-2/60 py-24">
        <Container>
          <Reveal>
            <SectionLabel>The Lineup</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance">
              Three cards. One standard of craft.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {lineup.map((card, i) => (
              <Reveal key={card.name} delay={i * 0.1}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-ink-3 p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/30">
                  <div className="aspect-[1.586/1] w-full rounded-xl bg-gradient-to-br from-ink-4 via-ink-3 to-ink-2 border border-gold/15" />
                  <h3 className="mt-6 font-display text-xl">{card.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-mist">{card.desc}</p>
                  <span className="mt-5 w-fit rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
                    {card.tag}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}

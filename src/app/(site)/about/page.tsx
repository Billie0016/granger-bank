import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FinalCTA } from "@/components/home/FinalCTA";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Compass, Gem, HandCoins, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Granger Bank",
};

const values = [
  {
    icon: Gem,
    title: "Quiet Excellence",
    detail: "We measure success by the trust our clients place in us, not by how loud we are about it.",
  },
  {
    icon: Compass,
    title: "Long-Term Thinking",
    detail: "Every product decision is weighed against decades, not quarters.",
  },
  {
    icon: HandCoins,
    title: "Radical Transparency",
    detail: "No hidden fees, no fine print designed to confuse. Ever.",
  },
  {
    icon: Users,
    title: "Human Judgment",
    detail: "Technology accelerates our team — it never replaces the relationship.",
  },
];

const timeline = [
  { year: "1998", label: "Founded as a private trust office serving 40 families." },
  { year: "2011", label: "Expanded into full-service personal and business banking." },
  { year: "2018", label: "Launched Granger Digital, our award-winning online platform." },
  { year: "2026", label: "Serving 180,000+ clients across personal, business and private banking." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Granger Bank"
        title="Private banking discipline. Modern digital execution."
        description="Granger Bank was founded on a simple premise: the most sophisticated financial institutions should also be the easiest to use. We've spent nearly three decades proving it."
      />

      <section className="py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            <Reveal>
              <SectionLabel>Our Story</SectionLabel>
              <h2 className="mt-6 font-display text-3xl leading-tight sm:text-4xl">
                Built by people who found banking beneath their clients.
              </h2>
              <p className="mt-6 leading-relaxed text-ivory-dim">
                Granger Bank began as a private trust office for a small group
                of families who wanted more than a teller line and a
                templated statement. Nearly thirty years later, that same
                philosophy — attentive, discreet, uncompromising — shapes
                every account we open, from a first checking account to a
                nine-figure credit facility.
              </p>
              <p className="mt-4 leading-relaxed text-ivory-dim">
                Today we combine that private-bank discipline with a modern
                technology platform, so every client gets institutional-grade
                security and personal, human attention — never a compromise
                between the two.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl border border-line bg-ink-3 p-7">
                <AnimatedNumber value={28} decimals={0} suffix=" yrs" className="font-display text-3xl text-ivory" />
                <p className="mt-2 text-sm text-mist">Serving clients</p>
              </div>
              <div className="rounded-2xl border border-line bg-ink-3 p-7">
                <AnimatedNumber value={180} decimals={0} suffix="K+" className="font-display text-3xl text-ivory" />
                <p className="mt-2 text-sm text-mist">Active clients</p>
              </div>
              <div className="rounded-2xl border border-line bg-ink-3 p-7">
                <AnimatedNumber value={41} decimals={0} prefix="$" suffix="B+" className="font-display text-3xl text-ivory" />
                <p className="mt-2 text-sm text-mist">Assets managed</p>
              </div>
              <div className="rounded-2xl border border-line bg-ink-3 p-7">
                <AnimatedNumber value={99.98} decimals={2} suffix="%" className="font-display text-3xl text-gold" />
                <p className="mt-2 text-sm text-mist">Platform uptime</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-ink-2/60 py-24">
        <Container>
          <Reveal>
            <SectionLabel>What We Believe</SectionLabel>
            <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight text-balance">
              Principles that don&apos;t change with the market cycle.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08} className="rounded-2xl border border-line bg-ink-3 p-7">
                <v.icon className="text-gold" size={26} strokeWidth={1.5} />
                <h3 className="mt-5 font-display text-lg">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{v.detail}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <Reveal>
            <SectionLabel>Our Path</SectionLabel>
            <h2 className="mt-6 font-display text-4xl leading-tight text-balance">Nearly three decades of quiet growth.</h2>
          </Reveal>
          <div className="mt-14 space-y-0 divide-y divide-line border-y border-line">
            {timeline.map((item, i) => (
              <Reveal key={item.year} delay={i * 0.06} className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:gap-10">
                <span className="font-display text-2xl text-gold sm:w-28">{item.year}</span>
                <span className="text-ivory-dim">{item.label}</span>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}

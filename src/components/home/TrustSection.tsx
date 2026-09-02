import { ShieldCheck, Lock, Radar, Headset } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    detail:
      "Multi-layer encryption and biometric authentication protect every transaction, every time.",
  },
  {
    icon: Lock,
    title: "Absolute Privacy",
    detail:
      "Your financial data is never sold. Granular controls let you decide exactly what's shared.",
  },
  {
    icon: Radar,
    title: "Real-Time Fraud Monitoring",
    detail:
      "Adaptive systems watch every account around the clock, flagging anomalies before they become losses.",
  },
  {
    icon: Headset,
    title: "24/7 Private Support",
    detail:
      "A dedicated relationship team is always reachable — day, night, weekends and holidays.",
  },
];

export function TrustSection() {
  return (
    <section className="relative border-y border-line bg-ink-2/60 py-28">
      <Container>
        <Reveal>
          <SectionLabel>Our Commitment</SectionLabel>
          <h2 className="mt-6 max-w-2xl font-display text-4xl leading-tight text-balance sm:text-5xl">
            Your money. Your future.
            <br />
            <span className="text-ivory-dim">Our responsibility.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <div className="group h-full bg-ink-2 p-8 transition-colors duration-300 hover:bg-ink-3">
                <pillar.icon
                  className="text-gold transition-transform duration-300 group-hover:-translate-y-0.5"
                  size={26}
                  strokeWidth={1.5}
                />
                <h3 className="mt-6 font-display text-lg text-ivory">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">
                  {pillar.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

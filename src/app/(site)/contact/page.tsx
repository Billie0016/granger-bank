import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/marketing/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Granger Bank",
};

const info = [
  { icon: MapPin, label: "Headquarters", value: "1 Granger Plaza, New York, NY 10005" },
  { icon: Phone, label: "Client Line", value: "1-800-555-0142" },
  { icon: Mail, label: "Email", value: "hello@grangerbank.example" },
  { icon: Clock, label: "Support Hours", value: "24/7, every day of the year" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We're reachable in the ways that matter."
        description="Whether you have a question about an account or want to talk through a private banking relationship, our team responds fast."
      />

      <section className="py-24">
        <Container className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="space-y-8">
            {info.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-ink-3">
                  <item.icon size={18} className="text-gold" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-mist">{item.label}</p>
                  <p className="mt-1 text-ivory-dim">{item.value}</p>
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </Container>
      </section>
    </>
  );
}

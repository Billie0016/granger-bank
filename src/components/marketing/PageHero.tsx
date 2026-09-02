import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/3 h-[420px] w-[420px] rounded-full bg-gold/[0.06] blur-[130px]" />
      </div>
      <Container className="relative">
        <Reveal>
          <SectionLabel>{eyebrow}</SectionLabel>
          <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight text-balance sm:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory-dim">
              {description}
            </p>
          )}
          {children}
        </Reveal>
      </Container>
    </section>
  );
}

import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[160px]" />
      </div>
      <Container className="relative text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight text-balance sm:text-5xl">
            Banking that feels like it was built for one person. You.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-ivory-dim">
            Open a Granger Bank account in minutes — no branch visit required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/register" size="lg">
              Open an Account
              <ArrowRight size={16} />
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Talk to an Advisor
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BankCard3D } from "@/components/three/BankCard3D";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-gold/[0.07] blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-emerald/[0.06] blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
      </div>

      <Container className="relative grid items-center gap-16 pt-16 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-32">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-gold"
          >
            <span className="h-px w-8 bg-gold/60" />
            Private &amp; Digital Banking
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem]"
          >
            Banking built around
            <br />
            your <span className="gold-text italic">financial future.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-lg text-lg leading-relaxed text-ivory-dim"
          >
            Experience smarter, more secure banking designed for the way you
            live, work and grow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Button href="/register" size="lg">
              Open an Account
              <ArrowRight size={16} />
            </Button>
            <Button href="/login" variant="secondary" size="lg">
              Sign In
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-14 grid grid-cols-3 gap-4 border-t border-line pt-8 sm:flex sm:items-center sm:gap-8"
          >
            <div className="min-w-0">
              <p className="font-display text-2xl text-ivory">$41B+</p>
              <p className="text-xs uppercase tracking-[0.14em] text-mist">Assets under management</p>
            </div>
            <div className="hidden h-8 w-px bg-line sm:block" />
            <div className="min-w-0">
              <p className="font-display text-2xl text-ivory">180K+</p>
              <p className="text-xs uppercase tracking-[0.14em] text-mist">Clients served</p>
            </div>
            <div className="hidden h-8 w-px bg-line sm:block" />
            <div className="min-w-0">
              <p className="font-display text-2xl text-ivory">24/7</p>
              <p className="text-xs uppercase tracking-[0.14em] text-mist">Fraud monitoring</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <BankCard3D />
        </motion.div>
      </Container>
    </section>
  );
}

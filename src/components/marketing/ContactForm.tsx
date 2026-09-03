"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-full flex-col items-center justify-center rounded-2xl border border-gold/25 bg-ink-3 p-14 text-center"
      >
        <CheckCircle2 className="text-gold" size={36} />
        <h3 className="mt-5 font-display text-2xl">Message sent</h3>
        <p className="mt-2 max-w-sm text-sm text-mist">
          This is a preview — no message was actually transmitted. A real Granger
          Bank advisor would reach out within one business day.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-5 rounded-2xl border border-line bg-ink-3 p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" required />
        <Field label="Last name" name="lastName" required />
      </div>
      <Field label="Email" name="email" type="email" required />
      <Field label="Subject" name="subject" />
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">
          Message
        </label>
        <textarea
          name="message"
          rows={5}
          required
          className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
          placeholder="How can we help?"
        />
      </div>
      <Button type="submit" size="lg" className="w-full">
        Send Message
      </Button>
      <p className="text-center text-xs text-mist">
        Preview form — no data is collected or transmitted.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
      />
    </div>
  );
}

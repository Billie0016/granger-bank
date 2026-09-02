"use client";

import { useState } from "react";
import { ChevronDown, Headset, MessageSquare, Phone } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Button } from "@/components/ui/Button";

const faqs = [
  { q: "How do I dispute a transaction?", a: "Go to Transactions, select the transaction in question, and choose \"Report an issue.\" A specialist will follow up within one business day." },
  { q: "How long do transfers take?", a: "Transfers between your own Granger Bank accounts are instant. External transfers typically settle within 1-3 business days." },
  { q: "How do I increase my card limit?", a: "Visit Cards → Manage Limits, or speak with your relationship advisor for private client limit increases." },
  { q: "Is my money insured?", a: "Deposits are protected up to the applicable limit under our member protection program, mirroring FDIC-style coverage." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <PageHeading title="Help & Support" subtitle="Get answers, or reach a real person — 24/7." />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-3">
          {faqs.map((faq, i) => (
            <div key={faq.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm text-ivory">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-mist transition-transform ${open === i ? "rotate-180 text-gold" : ""}`}
                />
              </button>
              {open === i && (
                <p className="px-6 pb-5 text-sm leading-relaxed text-mist">{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-ink-3 p-6">
            <Headset className="text-gold" size={22} />
            <p className="mt-4 text-sm text-ivory">24/7 Private Support</p>
            <p className="mt-1 text-xs text-mist">A relationship specialist is always available.</p>
            <Button variant="secondary" size="md" className="mt-4 w-full">
              <Phone size={14} /> 1-800-555-0142
            </Button>
          </div>
          <div className="rounded-2xl border border-line bg-ink-3 p-6">
            <MessageSquare className="text-gold" size={22} />
            <p className="mt-4 text-sm text-ivory">Live Chat</p>
            <p className="mt-1 text-xs text-mist">Average response time: under 2 minutes.</p>
            <Button size="md" className="mt-4 w-full">Start a Chat</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

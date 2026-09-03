import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { ShieldCheck } from "lucide-react";

const columns = [
  {
    title: "Banking",
    links: [
      { href: "/personal-banking", label: "Personal Banking" },
      { href: "/business-banking", label: "Business Banking" },
      { href: "/loans", label: "Loans" },
      { href: "/cards", label: "Cards" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Granger" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Sign In" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy Policy" },
      { href: "#", label: "Terms of Service" },
      { href: "#", label: "Security" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink-2">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
              Premium private and digital banking, built for the way you live,
              work and grow.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mist">
              <ShieldCheck size={16} className="text-gold" />
              Fictional institution · Not a real bank
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory-dim transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-[10px] text-[#454b56] md:flex-row md:items-center md:justify-between">
          <p>© 2026 Granger Bank. A fictional institution created for demonstration purposes only.</p>
          <p>No real accounts, transactions, or funds are processed on this site.</p>
        </div>
      </Container>
    </footer>
  );
}

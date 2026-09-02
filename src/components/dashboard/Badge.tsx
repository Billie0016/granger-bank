import { cn } from "@/lib/cn";

const tones = {
  positive: "border-emerald/30 bg-emerald/10 text-emerald",
  negative: "border-danger/30 bg-danger/10 text-danger",
  neutral: "border-line-strong bg-ivory/[0.04] text-ivory-dim",
  gold: "border-gold/30 bg-gold/10 text-gold",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

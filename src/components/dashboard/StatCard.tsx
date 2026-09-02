import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  decimals = 2,
  hint,
  hintTone = "neutral",
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  hint?: string;
  hintTone?: "positive" | "negative" | "neutral";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-ink-3 p-6", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-mist">{label}</p>
        {Icon && <Icon size={16} className="text-gold" />}
      </div>
      <AnimatedNumber
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        className="mt-3 block font-display text-3xl tabular-nums text-ivory"
      />
      {hint && (
        <p
          className={cn(
            "mt-2 text-xs",
            hintTone === "positive" && "text-emerald",
            hintTone === "negative" && "text-danger",
            hintTone === "neutral" && "text-mist"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

import { cn } from "@/lib/cn";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-gold",
        className
      )}
    >
      <span className="h-px w-8 bg-gold/60" />
      {children}
    </div>
  );
}

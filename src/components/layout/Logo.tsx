import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-lg tracking-wide text-ivory select-none",
        className
      )}
    >
      GRANGER<span className="font-light text-gold"> BANK</span>
    </span>
  );
}

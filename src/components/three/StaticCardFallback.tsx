import { cn } from "@/lib/cn";

export function StaticCardFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-full max-w-md rounded-[28px] border border-gold/20 bg-gradient-to-br from-ink-3 via-ink-2 to-ink p-8 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_45%)]" />
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="font-display text-xl tracking-wide">
            GRANGER<span className="text-gold font-light"> BANK</span>
          </p>
          <div className="flex flex-col items-end gap-2">
            <div className="h-8 w-11 rounded-md bg-gradient-to-br from-gold-2 via-gold to-gold-3" />
          </div>
        </div>
        <div>
          <p className="font-mono text-2xl tracking-[0.2em] text-ivory drop-shadow-sm">
            •••• •••• •••• 4827
          </p>
          <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ivory-dim">
            <div>
              <p className="text-[10px] text-mist">Cardholder</p>
              <p className="mt-1 text-sm tracking-[0.15em] text-ivory">Alex Morgan</p>
            </div>
            <div>
              <p className="text-[10px] text-mist">Valid thru</p>
              <p className="mt-1 text-sm tracking-[0.15em] text-ivory">09/30</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

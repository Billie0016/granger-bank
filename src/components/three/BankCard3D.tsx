"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { isWebGLAvailable } from "@/lib/webgl";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { StaticCardFallback } from "./StaticCardFallback";
import { cn } from "@/lib/cn";

// next/dynamic with ssr:false already manages its own loading state via the
// `loading` option below — wrapping it in an additional <Suspense> boundary
// on top of that is redundant.
const BankCardScene = dynamic(
  () => import("./BankCardScene").then((mod) => mod.BankCardScene),
  { ssr: false, loading: () => <StaticCardFallback /> }
);

export function BankCard3D({ className }: { className?: string }) {
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setSupportsWebGL(isWebGLAvailable());
  }, []);

  if (supportsWebGL === false) {
    return <StaticCardFallback className={className} />;
  }

  return (
    <div className={cn("relative aspect-[1.586/1] w-full max-w-md", className)}>
      {supportsWebGL === null && (
        <div className="absolute inset-0">
          <StaticCardFallback />
        </div>
      )}
      {supportsWebGL && (
        <div className="absolute inset-[-40%]">
          <BankCardScene interactive={!reducedMotion} />
        </div>
      )}
    </div>
  );
}

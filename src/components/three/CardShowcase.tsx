"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { isWebGLAvailable } from "@/lib/webgl";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { StaticCardFallback } from "./StaticCardFallback";
import { Button } from "@/components/ui/Button";

// See BankCard3D.tsx for why there is no extra <Suspense> here — next/dynamic
// with ssr:false already provides one via the `loading` option.
const CardShowcaseScene = dynamic(
  () => import("./CardShowcaseScene").then((mod) => mod.CardShowcaseScene),
  { ssr: false, loading: () => <StaticCardFallback /> }
);

export function CardShowcase() {
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);
  const [flipped, setFlipped] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setSupportsWebGL(isWebGLAvailable());
  }, []);

  if (supportsWebGL === false) {
    return <StaticCardFallback className="mx-auto" />;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center">
      <div className="relative aspect-[1.586/1] w-full">
        {supportsWebGL === null && (
          <div className="absolute inset-0">
            <StaticCardFallback />
          </div>
        )}
        {supportsWebGL && (
          <div className="absolute inset-[-35%]">
            <CardShowcaseScene flipped={flipped} interactive={!reducedMotion} />
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="md"
        className="mt-10"
        onClick={() => setFlipped((v) => !v)}
      >
        <RotateCw size={15} />
        Flip Card
      </Button>
      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mist">
        Drag to rotate · Click to flip
      </p>
    </div>
  );
}

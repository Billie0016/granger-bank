"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reducedMotion = usePrefersReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 28, stiffness: 90 });

  useEffect(() => {
    if (inView) motionValue.set(reducedMotion ? value : value);
  }, [inView, value, motionValue, reducedMotion]);

  useEffect(() => {
    if (reducedMotion && ref.current) {
      ref.current.textContent = `${prefix}${value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
      return;
    }
    const unsubscribe = spring.on("change", (latest) => {
      if (!ref.current) return;
      ref.current.textContent = `${prefix}${latest.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
    });
    return unsubscribe;
  }, [spring, prefix, suffix, decimals, reducedMotion, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
}

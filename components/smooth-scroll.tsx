"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Elegant inertial scrolling. Lenis drives the window scroll itself
 * (autoRaf), so native anchors, keyboard scrolling and accessibility
 * tooling keep working; it is disabled entirely for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.11,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      autoRaf: true,
    });

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}

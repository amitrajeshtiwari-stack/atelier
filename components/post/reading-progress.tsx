"use client";

import { useEffect, useState } from "react";

/**
 * Hairline reading-progress bar pinned under the site header. Updates via
 * rAF-throttled scroll listener — no re-render churn per frame.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    function measure() {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.max(0, Math.min(1, ratio)));
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-accent transition-transform duration-150 ease-linear"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element should keep a scene alive: on screen,
 * not scrolled far past, and the tab not hidden. Every state update
 * happens inside external-system callbacks (IntersectionObserver /
 * visibilitychange) — never synchronously in the effect body; the
 * observer's own first callback performs the initial measurement.
 */
export function useSceneVisibility(threshold = 0.02) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Observer always fires an initial callback, which measures first.
    const io = new IntersectionObserver(onIO, { threshold });
    io.observe(el);

    function near() {
      const rect = el!.getBoundingClientRect();
      const viewport = window.innerHeight;
      return rect.bottom > -viewport * 0.5 && rect.top < viewport * 1.5;
    }
    function onIO() {
      setVisible(!document.hidden && near());
    }
    function onVisibilityChange() {
      if (document.hidden) setVisible(false);
      else setVisible(near());
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [threshold]);

  return { ref, visible };
}

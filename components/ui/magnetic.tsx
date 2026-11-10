"use client";

import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Magnetic hover: the element drifts a few pixels toward the cursor and
 * settles back on leave. Buttons only, fine pointers only, and skipped
 * entirely under prefers-reduced-motion.
 */
export function Magnetic({
  children,
  className = "",
  strength = 0.25,
  maxOffset = 8,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  maxOffset?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  function onPointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const dx = Math.max(-maxOffset, Math.min(maxOffset, nx * rect.width * strength));
      const dy = Math.max(-maxOffset, Math.min(maxOffset, ny * rect.height * strength));
      el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.transform = "";
  }

  return (
    <span
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`inline-block transition-transform duration-300 ease-[var(--ease-editorial)] ${className}`}
    >
      {children}
    </span>
  );
}

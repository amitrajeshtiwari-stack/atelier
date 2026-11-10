"use client";

import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * CSS pointer tilt — the "object in space" feel for cards without a WebGL
 * context. Rotates the card toward the cursor with a soft specular sheen;
 * disabled for touch pointers and prefers-reduced-motion. Pure CSS
 * transforms, so it stays cheap even with a dozen cards on screen.
 */
export function TiltCard({
  children,
  className = "",
  maxTilt = 4,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;

    const { clientX, clientY } = event;
    const rect = el.getBoundingClientRect();
    // Normalized offsets from the card's center, −0.5 … 0.5.
    const nx = (clientX - rect.left) / rect.width - 0.5;
    const ny = (clientY - rect.top) / rect.height - 0.5;

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-ny * maxTilt).toFixed(2)}deg) rotateY(${(nx * maxTilt).toFixed(2)}deg) translateZ(0)`;
      if (glare) {
        el.style.setProperty("--glare-x", `${((nx + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--glare-y", `${((ny + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--glare-o", "1");
      }
    });
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.transform = "";
    if (glare) el.style.setProperty("--glare-o", "0");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`relative transition-[transform] duration-300 ease-[var(--ease-editorial)] will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      {glare ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] transition-opacity duration-500"
          style={{
            opacity: "var(--glare-o, 0)",
            background:
              "radial-gradient(240px circle at var(--glare-x, 50%) var(--glare-y, 0%), rgb(255 255 255 / 0.14), transparent 70%)",
            mixBlendMode: "soft-light",
          }}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SceneFallback } from "./scene-fallback";

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Gate every canvas behind client-side capability checks:
 *  - "checking": styled gradient skeleton (never renders raw markup)
 *  - "fallback": WebGL missing or prefers-reduced-motion → static gradient
 *  - "ok": render the lazy scene
 * Off-screen pausing is the child scene's own concern (it receives
 * visibility via its parent section, keeping this gate generic).
 */
export function useSceneCapability() {
  const [state, setState] = useState<"checking" | "ok" | "fallback">(
    "checking"
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => {
      if (!webglAvailable()) return setState("fallback");
      setState(mq.matches ? "fallback" : "ok");
    };
    evaluate();
    mq.addEventListener("change", evaluate);
    return () => mq.removeEventListener("change", evaluate);
  }, []);

  return state;
}

export function CapabilityGate({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const capability = useSceneCapability();

  if (capability === "ok") return <div className={className}>{children}</div>;

  return <SceneFallback className={className} />;
}

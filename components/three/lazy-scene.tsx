"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { SceneFallback } from "./scene-fallback";
import { CapabilityGate, useSceneCapability } from "./capability-gate";

/**
 * Lazily loads a 3D scene module (client-only, code-split) and shows the
 * shared static gradient while the chunk streams in.
 */
export function lazyScene<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>
) {
  return dynamic(loader, {
    ssr: false,
    loading: () => <SceneFallback className="absolute inset-0" />,
  });
}

export { CapabilityGate, useSceneCapability };

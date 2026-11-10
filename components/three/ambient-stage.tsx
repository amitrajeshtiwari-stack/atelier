"use client";

import { useTheme } from "@/lib/use-theme";
import { useSceneVisibility } from "@/lib/use-in-scene";
import { CapabilityGate } from "./capability-gate";
import { lazyScene } from "./lazy-scene";

const AmbientCanvas = lazyScene(() => import("./ambient-canvas"));

/**
 * Mount point for the post-page ambient scene. Always reduced footprint:
 * pauses when the article block is off-screen or the tab hidden. The
 * canvas sits behind the text at low opacity — decoration, never content.
 */
export function AmbientStage() {
  const theme = useTheme();
  const { ref, visible } = useSceneVisibility(0.01);

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      <CapabilityGate className="absolute inset-0">
        <div className="absolute inset-0 opacity-60 md:opacity-75">
          <AmbientCanvas theme={theme} paused={!visible} />
        </div>
      </CapabilityGate>
    </div>
  );
}

"use client";

import { useTheme } from "@/lib/use-theme";
import { useMediaQuery } from "@/lib/use-media-query";
import { useSceneVisibility } from "@/lib/use-in-scene";
import { CapabilityGate } from "./capability-gate";
import { lazyScene } from "./lazy-scene";

const HeroCanvas = lazyScene(() => import("./hero-canvas"));

/**
 * Mount point for the hero scene. Owns the responsive flags from the
 * design system: heavy geometry only above 640px, pointer parallax only
 * for fine pointers (never on touch). Pauses the frameloop whenever the
 * hero block scrolls out of sight or the tab is hidden.
 */
export function HeroStage() {
  const theme = useTheme();
  const { ref, visible } = useSceneVisibility();

  const wide = useMediaQuery("(min-width: 640px)");
  const finePointer = useMediaQuery("(pointer: fine)");

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      <CapabilityGate className="absolute inset-0">
        <HeroCanvas
          theme={theme}
          compact={!wide}
          parallax={wide && finePointer}
          paused={!visible}
        />
      </CapabilityGate>
    </div>
  );
}

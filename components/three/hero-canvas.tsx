"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { MonolithCluster } from "./monolith-cluster";
import type { Theme } from "@/lib/use-theme";

/**
 * Lazy scene #1 — hero monolith cluster.
 * 3+1 point lighting (key, fill, rim + soft ambient) via a procedural
 * Lightformer environment (zero network fetches, unlike HDR presets),
 * soft ContactShadows, and restrained postprocessing (bloom/noise/vignette).
 * The frameloop pauses while the block is off-screen (`paused`), and all
 * geometry/materials are disposed by R3F on unmount.
 */
export default function HeroCanvas({
  theme,
  compact,
  parallax,
  paused,
}: {
  theme: Theme;
  compact: boolean;
  parallax: boolean;
  paused: boolean;
}) {
  const dark = theme === "dark";

  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows="soft"
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0, 0.55, 7.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Lighting                                                                   3-point + ambient */}
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight
        castShadow
        position={[4, 6, 3]}
        intensity={dark ? 1.1 : 1.6}
        color={dark ? "#d8c08a" : "#fff6e3"}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <spotLight
        position={[-6, 4, -2]}
        intensity={dark ? 2.2 : 1.4}
        angle={0.5}
        penumbra={1}
        color={dark ? "#8a7550" : "#f4e8d0"}
      />

      {/* Procedural studio environment — 3 soft lightformers on a card. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={[dark ? "#141210" : "#f4efe5"]} />
        <Lightformer
          form="rect"
          intensity={dark ? 2.4 : 3.2}
          color="#fff6e8"
          position={[0, 5, -1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={dark ? 1.4 : 1.8}
          color={dark ? "#9c8154" : "#e8dcc4"}
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 3, 1]}
        />
        <Lightformer
          form="circle"
          intensity={dark ? 2.0 : 1.4}
          color={dark ? "#c8a566" : "#caa06a"}
          position={[4, -1, 3]}
          scale={[3, 3, 1]}
        />
      </Environment>

      <MonolithCluster
        theme={theme}
        compact={compact}
        paused={paused}
        parallax={parallax}
      />

      <ContactShadows
        position={[0, -2.35, 0]}
        opacity={dark ? 0.62 : 0.38}
        scale={13}
        blur={2.7}
        far={4.5}
        resolution={256}
        color={dark ? "#000000" : "#5c4d32"}
      />

      {/* Postprocessing only on roomy viewports — mobile keeps raw AA. */}
      {!compact && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.88} />
          <Noise opacity={0.045} />
          <Vignette offset={0.28} darkness={dark ? 0.55 : 0.35} eskil={false} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

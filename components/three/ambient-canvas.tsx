"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Theme } from "@/lib/use-theme";

/**
 * Lazy scene #2 — post-page ambient: two floating glass slabs and a thin
 * paper plane drifting behind the reading column. Same lighting language
 * as the hero (procedural Lightformer environment, no HDR downloads),
 * deliberately quieter — the text is the exhibit. No shadows cast, no
 * bloom; frameloop pauses off-screen via `paused`.
 */

function useDrift(
  ref: React.RefObject<THREE.Mesh | null>,
  paused: boolean,
  seed: number
) {
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh || paused) return;
    const t = state.clock.elapsedTime + seed;
    mesh.position.y = Math.sin(t * 0.4) * 0.12;
    mesh.rotation.x = 0.12 + Math.sin(t * 0.3) * 0.03;
    mesh.rotation.z = -0.08 + Math.cos(t * 0.26) * 0.025;
  });
}

function GlassSlab({
  theme,
  paused,
  position,
  scale,
  seed,
}: {
  theme: Theme;
  paused: boolean;
  position: [number, number, number];
  scale: [number, number, number];
  seed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useDrift(ref, paused, seed);
  const dark = theme === "dark";
  return (
    <mesh ref={ref} position={position} scale={scale} castShadow={false}>
      <boxGeometry args={[1, 1.4, 0.05]} />
      <meshPhysicalMaterial
        color={dark ? "#2b241c" : "#f2ead9"}
        roughness={dark ? 0.16 : 0.24}
        metalness={dark ? 0.7 : 0.15}
        clearcoat={0.9}
        clearcoatRoughness={0.25}
        envMapIntensity={dark ? 1.4 : 0.9}
      />
    </mesh>
  );
}

function PaperPlane({
  paused,
  position,
  rotation,
  seed,
}: {
  paused: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  seed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useDrift(ref, paused, seed);
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <boxGeometry args={[1.1, 1.5, 0.012]} />
      <meshStandardMaterial color="#efe6d3" roughness={0.85} metalness={0} envMapIntensity={0.5} />
    </mesh>
  );
}

export default function AmbientCanvas({
  theme,
  paused,
}: {
  theme: Theme;
  paused: boolean;
}) {
  const dark = theme === "dark";

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0, 0, 6.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight
        position={[4, 5, 2]}
        intensity={dark ? 0.9 : 1.2}
        color={dark ? "#d8c08a" : "#fff6e3"}
      />

      <Environment resolution={128} frames={1}>
        <color attach="background" args={[dark ? "#141210" : "#f4efe5"]} />
        <Lightformer
          form="rect"
          intensity={dark ? 2.0 : 2.6}
          color="#fff6e8"
          position={[0, 5, -1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="circle"
          intensity={dark ? 1.6 : 1.2}
          color={dark ? "#c8a566" : "#caa06a"}
          position={[4, -1, 3]}
          scale={[2.6, 2.6, 1]}
        />
      </Environment>

      <GlassSlab theme={theme} paused={paused} position={[2.6, 0.7, -0.6]} scale={[1.35, 1.35, 1]} seed={0.4} />
      <GlassSlab theme={theme} paused={paused} position={[3.3, -1.3, -1.8]} scale={[0.85, 0.85, 1]} seed={2.1} />
      <PaperPlane paused={paused} position={[-3.1, 0.9, -1.4]} rotation={[0.1, 0.35, 0.06]} seed={4.6} />

      <ContactShadows
        position={[0, -2.6, 0]}
        opacity={dark ? 0.5 : 0.28}
        scale={12}
        blur={2.9}
        far={4}
        resolution={128}
        color={dark ? "#000000" : "#5c4d32"}
      />

      <Vignette offset={0.32} darkness={dark ? 0.5 : 0.3} eskil={false} />
    </Canvas>
  );
}

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import type { Group } from "three";

/**
 * Per-theme material + light tuning, mirroring the CSS design tokens:
 * frosted plaster/champagne glass in light mode, subtle obsidian mirror
 * in dark mode.
 */
const THEME = {
  light: {
    base: "#f2ead8",
    accent: "#caa06a",
    transmission: 0.62,
    roughness: 0.26,
    metalness: 0.05,
    attenuationDistance: 1.8,
    envIntensity: 0.65,
    thickness: 1.1,
  },
  dark: {
    base: "#26211a",
    accent: "#c8a566",
    transmission: 0.88,
    roughness: 0.15,
    metalness: 0.35,
    attenuationDistance: 2.4,
    envIntensity: 0.9,
    thickness: 1.8,
  },
} as const;

type ThemeName = keyof typeof THEME;
type Shape = "monolith" | "slab" | "sphere" | "torus";

const GEOMETRY = {
  monolith: { args: [1.1, 2.6, 0.8] as const, radius: 0.14 },
  slab: { args: [1.5, 0.9, 0.55] as const, radius: 0.1 },
} as const;

/** One glass/plaster volume in the monolith cluster. */
export function Volume({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  shape,
  floatIntensity = 0.4,
  theme,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  shape: Shape;
  floatIntensity?: number;
  theme: ThemeName;
}) {
  const t = THEME[theme];
  const material = (
    <meshPhysicalMaterial
      color={theme === "dark" ? t.base : t.accent}
      transmission={t.transmission}
      roughness={t.roughness}
      metalness={t.metalness}
      ior={1.45}
      thickness={t.thickness}
      attenuationColor={t.accent}
      attenuationDistance={t.attenuationDistance}
      clearcoat={0.4}
      clearcoatRoughness={0.3}
      envMapIntensity={t.envIntensity}
    />
  );

  return (
    <Float
      speed={1.6}
      rotationIntensity={0.35}
      floatIntensity={floatIntensity}
    >
      {shape === "monolith" && (
        <RoundedBox
          args={[...GEOMETRY.monolith.args]}
          radius={GEOMETRY.monolith.radius}
          smoothness={5}
          position={position}
          rotation={rotation}
          scale={scale}
          castShadow
          receiveShadow
        >
          {material}
        </RoundedBox>
      )}
      {shape === "slab" && (
        <RoundedBox
          args={[...GEOMETRY.slab.args]}
          radius={GEOMETRY.slab.radius}
          smoothness={5}
          position={position}
          rotation={rotation}
          scale={scale}
          castShadow
          receiveShadow
        >
          {material}
        </RoundedBox>
      )}
      {shape === "sphere" && (
        <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <sphereGeometry args={[0.85, 48, 48]} />
          {material}
        </mesh>
      )}
      {shape === "torus" && (
        <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <torusGeometry args={[0.62, 0.24, 32, 96]} />
          {material}
        </mesh>
      )}
    </Float>
  );
}

/**
 * The whole cluster. Pointer parallax is lerped — a slow, calm drift,
 * never snappy — and disabled on touch/compact viewports per the perf
 * budget (`parallax={false}`).
 */
export function MonolithCluster({
  theme,
  compact = false,
  paused = false,
  parallax = true,
}: {
  theme: ThemeName;
  compact?: boolean;
  paused?: boolean;
  parallax?: boolean;
}) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!group.current || paused) return;
    const px = parallax ? state.pointer.x : 0;
    const py = parallax ? state.pointer.y : 0;
    const k = 1 - Math.pow(1 - 0.045, delta * 60);
    group.current.rotation.y += (px * 0.28 - group.current.rotation.y) * k;
    group.current.rotation.x += (-py * 0.16 - group.current.rotation.x) * k;
    const breathe = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
    group.current.position.y += (breathe - group.current.position.y) * k;
  });

  if (compact) {
    return (
      <group ref={group}>
        <Volume
          shape="monolith"
          position={[0, -0.15, 0]}
          scale={0.9}
          theme={theme}
        />
        <Volume
          shape="sphere"
          position={[1.7, -1.25, -0.6]}
          scale={0.66}
          floatIntensity={0.55}
          theme={theme}
        />
        <Volume
          shape="slab"
          position={[-1.65, -1.5, 0.2]}
          scale={0.62}
          floatIntensity={0.5}
          theme={theme}
        />
      </group>
    );
  }

  return (
    // Sits right of the text column so the headline reads left in light mode.
    <group ref={group} position={[1.3, 0, 0]}>
      <Volume
        shape="monolith"
        position={[0, -0.1, 0]}
        rotation={[0.06, -0.5, 0.02]}
        theme={theme}
      />
      {/* Supporting volumes */}
      <Volume
        shape="slab"
        position={[2.25, -1.55, -0.4]}
        rotation={[0.12, 0.7, 0.1]}
        scale={0.84}
        floatIntensity={0.55}
        theme={theme}
      />
      <Volume
        shape="sphere"
        position={[-1.95, -1.05, 0.35]}
        scale={0.78}
        floatIntensity={0.6}
        theme={theme}
      />
      <Volume
        shape="torus"
        position={[-1.35, 1.15, -0.9]}
        rotation={[0.6, 0.2, -0.4]}
        scale={0.72}
        floatIntensity={0.75}
        theme={theme}
      />
      {/* Small satellites for depth */}
      <Volume
        shape="sphere"
        position={[1.4, 1.05, -1.4]}
        scale={0.32}
        floatIntensity={0.9}
        theme={theme}
      />
      <Volume
        shape="slab"
        position={[-0.5, 1.65, -0.5]}
        rotation={[0.3, 0.9, 0.15]}
        scale={0.42}
        floatIntensity={0.85}
        theme={theme}
      />
    </group>
  );
}

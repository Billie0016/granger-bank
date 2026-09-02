"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { createCardTexture, CARD_ASPECT } from "./cardFaceTexture";

const CARD_WIDTH = 3.4;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
const CARD_DEPTH = 0.055;

function Card({ interactive }: { interactive: boolean }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  const [frontTex, backTex] = useMemo(
    () => [createCardTexture("front", "gold"), createCardTexture("back", "gold")],
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;

    if (interactive) {
      target.current.x = state.pointer.y * 0.28;
      target.current.y = state.pointer.x * 0.4;
    }

    const t = state.clock.elapsedTime;
    const floatY = interactive ? Math.sin(t * 0.6) * 0.06 : 0;
    const idleTiltX = interactive ? Math.sin(t * 0.4) * 0.02 : 0;
    const idleTiltY = interactive ? Math.cos(t * 0.35) * 0.03 : 0;

    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      -target.current.x + idleTiltX,
      4,
      delta
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      target.current.y + idleTiltY + 0.12,
      4,
      delta
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      floatY,
      4,
      delta
    );
  });

  return (
    <group ref={group} rotation={[0, 0.12, 0]}>
      <RoundedBox
        args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]}
        radius={0.11}
        smoothness={6}
        castShadow
      >
        <meshPhysicalMaterial
          color="#12151c"
          metalness={0.75}
          roughness={0.32}
          clearcoat={0.55}
          clearcoatRoughness={0.22}
          envMapIntensity={1.3}
        />
      </RoundedBox>

      <mesh position={[0, 0, CARD_DEPTH / 2 + 0.002]}>
        <planeGeometry args={[CARD_WIDTH * 0.985, CARD_HEIGHT * 0.985]} />
        <meshBasicMaterial map={frontTex} transparent toneMapped={false} />
      </mesh>

      <mesh position={[0, 0, -(CARD_DEPTH / 2 + 0.002)]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH * 0.985, CARD_HEIGHT * 0.985]} />
        <meshBasicMaterial map={backTex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

export function BankCardScene({ interactive = true }: { interactive?: boolean }) {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5.2], fov: 32 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      onError={() => setDpr([1, 1])}
    >
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.4}
        color="#f2e7cc"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#7ea1c9" />
      <spotLight position={[-3, 3, 4]} intensity={0.6} angle={0.5} penumbra={1} color="#c9a458" />

      <Card interactive={interactive} />

      <Sparkles count={28} scale={[6, 4, 2]} size={1.4} speed={0.2} opacity={0.25} color="#c9a458" />

      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.55}
        scale={8}
        blur={2.6}
        far={2}
        color="#000000"
      />

      {/* Synthetic, self-contained environment (no external HDR fetch) —
          keeps CSP locked to 'self' with no third-party asset dependency.
          See docs/production/07-security-architecture.md §1. */}
      <Environment resolution={256}>
        <Lightformer intensity={2.5} color="#f2e7cc" position={[3, 3, 4]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.2} color="#c9a458" position={[-4, 1, 3]} scale={[3, 3, 1]} />
        <Lightformer intensity={0.8} color="#7ea1c9" position={[0, -3, -3]} scale={[6, 3, 1]} />
        <Lightformer intensity={1.5} color="#ffffff" position={[0, 4, -2]} scale={[8, 2, 1]} form="ring" />
      </Environment>
    </Canvas>
  );
}

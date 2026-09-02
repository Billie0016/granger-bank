"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { createCardTexture, CARD_ASPECT } from "./cardFaceTexture";

const CARD_WIDTH = 3.6;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
const CARD_DEPTH = 0.06;

function Card({
  flipped,
  dragRotation,
}: {
  flipped: boolean;
  dragRotation: React.MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  const [frontTex, backTex] = useMemo(
    () => [createCardTexture("front", "gold"), createCardTexture("back", "gold")],
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const flipTarget = flipped ? Math.PI : 0;
    const t = state.clock.elapsedTime;
    const tiltX = Math.sin(t * 0.5) * 0.03 - pointer.y * 0.12;

    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, tiltX, 4, delta);
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      flipTarget + dragRotation.current,
      6,
      delta
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      Math.sin(t * 0.6) * 0.05,
      4,
      delta
    );
  });

  return (
    <group ref={group}>
      <RoundedBox args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} radius={0.12} smoothness={6} castShadow>
        <meshPhysicalMaterial
          color="#12151c"
          metalness={0.75}
          roughness={0.3}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
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

export function CardShowcaseScene({
  flipped,
  interactive = true,
}: {
  flipped: boolean;
  interactive?: boolean;
}) {
  const dragRotation = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  return (
    <div
      className="h-full w-full cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        if (!interactive) return;
        dragging.current = true;
        lastX.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!interactive || !dragging.current) return;
        const delta = e.clientX - lastX.current;
        lastX.current = e.clientX;
        dragRotation.current += delta * 0.008;
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 5.4], fov: 32 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#f2e7cc" castShadow shadow-mapSize={[512, 512]} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#7ea1c9" />
        <spotLight position={[-3, 3, 4]} intensity={0.6} angle={0.5} penumbra={1} color="#c9a458" />

        <Card flipped={flipped} dragRotation={dragRotation} />

        <Sparkles count={24} scale={[6, 4, 2]} size={1.3} speed={0.2} opacity={0.2} color="#c9a458" />

        <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={8} blur={2.6} far={2} color="#000000" />
        {/* Synthetic, self-contained environment — see
            docs/production/07-security-architecture.md §1. */}
        <Environment resolution={256}>
          <Lightformer intensity={2.5} color="#f2e7cc" position={[3, 3, 4]} scale={[4, 4, 1]} />
          <Lightformer intensity={1.2} color="#c9a458" position={[-4, 1, 3]} scale={[3, 3, 1]} />
          <Lightformer intensity={0.8} color="#7ea1c9" position={[0, -3, -3]} scale={[6, 3, 1]} />
          <Lightformer intensity={1.5} color="#ffffff" position={[0, 4, -2]} scale={[8, 2, 1]} form="ring" />
        </Environment>
      </Canvas>
    </div>
  );
}

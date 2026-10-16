"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { ReactNode } from "react";

export default function CanvasShell({
  children,
  active,
  camera = [0, 0.5, 7],
  fov = 40,
}: {
  children: ReactNode;
  active: boolean;
  camera?: [number, number, number];
  fov?: number;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: camera, fov }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 2]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#7fb2ff" position={[-5, 1, 2]} scale={[3, 5, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[5, 2, -2]} scale={3} />
      </Environment>
      {children}
    </Canvas>
  );
}

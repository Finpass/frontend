"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { Scene3D } from "./Scene3D";
import { Poster } from "./Poster";
import { Bars, Chat, CoinCharacter, CoinStack, Doc, Gauge, GlowDisc, KeyHouse, Orb, OrbitRing, Shield, Sparkle, Step, stepHeight, stepX, stepZ } from "./parts";

/** Mouse-parallax tilt wrapper. */
function Tilt({ children, amount = 0.15 }: { children: ReactNode; amount?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer }, dt) => {
    if (!g.current) return;
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, pointer.x * amount, 3, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -pointer.y * amount * 0.4, 3, dt);
  });
  return <group ref={g}>{children}</group>;
}

const ISO: [number, number, number] = [7.2, 5.7, 8.8];
// hero shows the full orbit rings, so pull the camera back along the same view direction
const HERO_CAM = ISO.map((v) => v * 1.08) as [number, number, number];
const topTop = () => stepHeight(4) - 1.2;

export function HeroScene({ className = "", label }: { className?: string; label: string }) {
  return (
    <Scene3D className={className} label={label} camera={HERO_CAM} fov={30}>
      {() => (
        <Tilt>
          <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.25}>
            <GlowDisc position={[0, -1.19, 0]} size={7} color="rgba(58,106,224,0.55)" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Step key={i} index={i} />
            ))}
            <GlowDisc position={[stepX(4), topTop() + 0.01, stepZ(4)]} size={1.5} />
            <CoinCharacter />
            <Orb eyes={false} follow={false} position={[stepX(4), topTop() + 1.15, stepZ(4)]} size={0.62} />
            <OrbitRing radius={3.4} tilt={[0.35, 0, 0.15]} center={[0, 0.8, 0]} coins={3} speed={0.22} />
            <OrbitRing radius={2.7} tilt={[-0.25, 0, -0.2]} center={[0, 0.5, 0]} coins={2} speed={-0.3} />
            <Sparkle position={[-2.4, 1.4, 1.5]} phase={0} />
            <Sparkle position={[2.9, 2.6, 1]} size={0.12} phase={1.5} />
            <Sparkle position={[-1.2, 2.6, -0.5]} size={0.1} phase={3} />
            <Sparkle position={[2.2, 0.2, 2.6]} size={0.13} phase={4.5} />
          </Float>
        </Tilt>
      )}
    </Scene3D>
  );
}

export function LadderScene({
  active,
  onSelect,
  className = "",
  label,
}: {
  active: number;
  onSelect: (i: number) => void;
  className?: string;
  label: string;
}) {
  return (
    <Scene3D className={className} label={label} camera={ISO} fov={30} allowMobile poster={<Poster label={label} />}>
      {() => (
        <Tilt amount={0.1}>
          <GlowDisc position={[0, -1.19, 0]} size={7} color="rgba(58,106,224,0.45)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Step key={i} index={i} active={i === active} onOver={() => onSelect(i)} onClick={() => onSelect(i)} />
          ))}
          <Orb eyes={false} follow={false} position={[stepX(active), stepHeight(active) - 1.2 + 0.85, stepZ(active)]} size={0.36} pulse />
        </Tilt>
      )}
    </Scene3D>
  );
}

export type PropKind = "shield" | "piggy" | "bars" | "key" | "doc" | "gauge" | "chat";

export function PropScene({ kind, label, className = "" }: { kind: PropKind; label: string; className?: string }) {
  return (
    <Scene3D className={className} label={label} camera={[0, 0, 4.5]} allowMobile>
      {() => (
        <Float speed={2} floatIntensity={0.6} rotationIntensity={0.6}>
          {kind === "shield" && <Shield />}
          {kind === "piggy" && <CoinStack />}
          {kind === "bars" && <Bars />}
          {kind === "key" && <KeyHouse />}
          {kind === "doc" && <Doc />}
          {kind === "gauge" && <Gauge />}
          {kind === "chat" && <Chat />}
        </Float>
      )}
    </Scene3D>
  );
}

/** Orb mascot; `pulse` is driven by hover over "AI explains" areas. */
export function OrbScene({ pulse, label, className = "" }: { pulse: boolean; label: string; className?: string }) {
  return (
    <Scene3D className={className} label={label} camera={[0, 0, 4]} allowMobile>
      {() => <Orb size={0.9} pulse={pulse} />}
    </Scene3D>
  );
}

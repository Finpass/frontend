"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { colors } from "@/design-system/colors";

export const GAIN = "#4ade80";
export const NAVY = "#111a3a";
export const ACCENT = colors.accent;
export const GOLD = "#d9b46a";
const SKY = "#7fb2ff";

/** Procedural blue banknote texture: frame, corner ornaments, centre medallion, guilloche. */
function useNoteTexture() {
  return useMemo(() => {
    const W = 512;
    const c = document.createElement("canvas");
    c.width = c.height = W;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, W, W);
    grad.addColorStop(0, "#4a7df0");
    grad.addColorStop(1, "#2a56c8");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, W);
    g.strokeStyle = "rgba(10,30,100,0.28)";
    g.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = W / 2 + Math.sin(x / 30 + i * 0.5) * (8 + i * 7);
        if (x) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    }
    g.strokeStyle = "rgba(10,30,100,0.55)";
    g.lineWidth = 5;
    g.strokeRect(26, 26, W - 52, W - 52);
    g.lineWidth = 2;
    g.strokeRect(42, 42, W - 84, W - 84);
    // corner ornaments
    for (const [cx, cy] of [[70, 70], [W - 70, 70], [70, W - 70], [W - 70, W - 70]]) {
      for (let r = 10; r <= 34; r += 8) {
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // medallion
    g.fillStyle = "rgba(10,30,100,0.5)";
    g.beginPath();
    g.ellipse(W / 2, W / 2, 96, 86, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(160,200,255,0.5)";
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(W / 2, W / 2, 112, 102, 0, 0, Math.PI * 2);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
}

type StepProps = {
  index: number;
  active?: boolean;
  onOver?: () => void;
  onClick?: () => void;
  rise?: number;
};

export const STEP_W = 1.15;
export const STEP_D = 1.9;
export const stepHeight = (i: number) => 0.6 + i * 0.5;
// stairs ascend toward back-right so an isometric camera sees top, front and side faces
export const stepX = (i: number) => (i - 2) * 1.0;
export const stepZ = (i: number) => -(i - 2) * 0.95;

export function Step({ index, active, onOver, onClick, rise = 1 }: StepProps) {
  const tex = useNoteTexture();
  const ref = useRef<THREE.Group>(null);
  const h = stepHeight(index);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.scale.y = THREE.MathUtils.damp(ref.current.scale.y, rise, 4, dt);
  });
  return (
    <group ref={ref} position={[stepX(index), -1.2, stepZ(index)]} scale={[1, 0.001, 1]}>
      <RoundedBox
        args={[STEP_W, h, STEP_D]}
        radius={0.14}
        smoothness={6}
        position={[0, h / 2, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onOver?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <meshPhysicalMaterial
          map={tex}
          color={active ? "#a9c4ff" : "#ffffff"}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.12}
          emissive={active ? SKY : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
        />
      </RoundedBox>
    </group>
  );
}

function useGlowTexture(color: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, color);
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, [color]);
}

/** Soft glowing disc lying on a surface. */
export function GlowDisc({ position, size = 1.6, color = "rgba(127,178,255,0.9)" }: { position: [number, number, number]; size?: number; color?: string }) {
  const map = useGlowTexture(color);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

export function Coin({ scale = 0.2, ...p }: { scale?: number } & React.ComponentProps<"group">) {
  return (
    <group {...p} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.2, 24, 48]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.28, 48]} />
        <meshStandardMaterial color="#e6c98a" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Thin glowing orbit ring with gold coins travelling on it. */
export function OrbitRing({
  radius,
  tilt,
  speed = 0.25,
  coins = 2,
  center = [0, 0, 0] as [number, number, number],
}: {
  radius: number;
  tilt: [number, number, number];
  speed?: number;
  coins?: number;
  center?: [number, number, number];
}) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * speed;
  });
  return (
    <group position={center} rotation={tilt}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.012, 8, 128]} />
        <meshBasicMaterial color={SKY} transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <group ref={spin}>
        {Array.from({ length: coins }, (_, i) => {
          const a = (i / coins) * Math.PI * 2;
          return <Coin key={i} scale={0.2} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[1.1, a, 0.4]} />;
        })}
      </group>
    </group>
  );
}

/** Gold 4-point sparkle that always faces the camera. */
export function Sparkle({ position, size = 0.16, phase = 0 }: { position: [number, number, number]; size?: number; phase?: number }) {
  const m = useRef<THREE.Mesh>(null);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const r = 1, i = 0.22;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      const rad = k % 2 === 0 ? r : i;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (k) s.lineTo(x, y);
      else s.moveTo(x, y);
    }
    return s;
  }, []);
  useFrame(({ clock }) => {
    if (m.current) m.current.scale.setScalar(size * (0.6 + 0.5 * Math.sin(clock.elapsedTime * 2 + phase)));
  });
  return (
    <Billboard position={position}>
      <mesh ref={m}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="#f0cd7a" toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

/** Cute gold coin character walking up the steps. */
export function CoinCharacter() {
  const ref = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime / 1.3;
    const i = Math.floor(t) % 4;
    const f = t % 1;
    const e = f * f * (3 - 2 * f);
    g.position.x = THREE.MathUtils.lerp(stepX(i), stepX(i + 1), e);
    g.position.z = THREE.MathUtils.lerp(stepZ(i), stepZ(i + 1), e);
    g.position.y = THREE.MathUtils.lerp(stepHeight(i), stepHeight(i + 1), e) - 1.2 + 0.62 + Math.sin(f * Math.PI) * 0.35;
    const sw = Math.sin(f * Math.PI * 2) * 0.7;
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
  });
  const gold = <meshStandardMaterial color="#f5d98f" emissive="#8a6420" emissiveIntensity={0.35} metalness={0.6} roughness={0.35} />;
  return (
    <group ref={ref}>
      <group rotation={[0, 0.7, 0]} scale={0.7}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.14, 48]} />
          {gold}
        </mesh>
        <mesh>
          <torusGeometry args={[0.5, 0.07, 16, 48]} />
          {gold}
        </mesh>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.08, 0.1]} scale={[0.5, 0.8, 0.3]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#3a2616" />
          </mesh>
        ))}
        <mesh position={[0, -0.02, 0.1]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.09, 0.018, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#3a2616" />
        </mesh>
        <mesh ref={legL} position={[-0.17, -0.62, 0]}>
          <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
          {gold}
        </mesh>
        <mesh ref={legR} position={[0.17, -0.62, 0]}>
          <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
          {gold}
        </mesh>
        <mesh position={[0.6, 0.12, 0]} rotation={[0, 0, -0.9]}>
          <capsuleGeometry args={[0.055, 0.22, 6, 12]} />
          {gold}
        </mesh>
        <mesh position={[-0.58, -0.08, 0]} rotation={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.055, 0.2, 6, 12]} />
          {gold}
        </mesh>
      </group>
    </group>
  );
}

/** Glass orb with glowing core and gold ring. `eyes` turns it into the AI mascot. */
export function Orb({
  pulse = false,
  follow = true,
  eyes = true,
  position = [0, 0, 0] as [number, number, number],
  size = 0.6,
}) {
  const g = useRef<THREE.Group>(null);
  const eyeG = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Mesh[]>([]);
  const p = useRef(0);
  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    if (g.current) {
      const tx = position[0] + (follow ? pointer.x * 0.3 : 0);
      const ty = position[1] + Math.sin(t * 1.4) * 0.1 + (follow ? pointer.y * 0.2 : 0);
      g.current.position.x = THREE.MathUtils.damp(g.current.position.x, tx, 3, dt);
      g.current.position.y = THREE.MathUtils.damp(g.current.position.y, ty, 3, dt);
      g.current.position.z = position[2];
      g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, follow ? pointer.x * 0.5 : 0, 3, dt);
    }
    if (eyeG.current) eyeG.current.scale.y = Math.sin(t * 0.9) > 0.985 ? 0.1 : 1;
    p.current = THREE.MathUtils.damp(p.current, pulse ? 1 : eyes ? 0.25 : 0, 4, dt);
    rings.current.forEach((m, i) => {
      if (!m) return;
      const ph = (t * (0.4 + p.current) + i / 3) % 1;
      m.scale.setScalar(size * (1.2 + ph * 1.2));
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.5 * p.current;
    });
  });
  return (
    <group ref={g} position={position}>
      <mesh scale={size}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#eaf1ff"
          transparent
          opacity={0.4}
          roughness={0.04}
          iridescence={1}
          iridescenceIOR={1.7}
          iridescenceThicknessRange={[200, 600]}
          clearcoat={1}
          envMapIntensity={1.6}
        />
      </mesh>
      <mesh scale={size * 0.62}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={SKY} emissive={SKY} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <pointLight color={SKY} intensity={pulse ? 6 : 3} distance={5} />
      <mesh rotation={[Math.PI / 2.3, 0, 0.25]} scale={size}>
        <torusGeometry args={[1.22, 0.025, 12, 96]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
      </mesh>
      {eyes ? (
        <group ref={eyeG} position={[0, 0.05 * size, size * 0.6]}>
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x * size, 0, 0]} scale={[0.09 * size, 0.16 * size, 0.05 * size]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color={NAVY} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, 0, size * 0.55]} rotation={[0, 0, 0.6]} scale={[size * 0.2, size * 0.34, size * 0.02]}>
          <octahedronGeometry args={[1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>
      )}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => void (m && (rings.current[i] = m))} rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[1, 0.012, 8, 64]} />
          <meshBasicMaterial color={SKY} transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const PERI = "#8ea2ff";
const TEAL = "#2dd4bf";

// luminous clay: emissive keeps the props readable on the dark page, clearcoat gives the glossy orb look
const glossy = (color: string, glow = 0.45) => (
  <meshPhysicalMaterial
    color={color}
    emissive={color}
    emissiveIntensity={glow}
    metalness={0.05}
    roughness={0.18}
    clearcoat={1}
    clearcoatRoughness={0.06}
    iridescence={0.5}
    iridescenceIOR={1.5}
  />
);
const white = <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} toneMapped={false} />;

const shieldShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.62, 0.78);
  s.lineTo(0.62, 0.78);
  s.lineTo(0.62, 0.05);
  s.quadraticCurveTo(0.62, -0.5, 0, -0.9);
  s.quadraticCurveTo(-0.62, -0.5, -0.62, 0.05);
  s.closePath();
  return s;
})();

export function Shield() {
  return (
    <group>
      <mesh position={[0, 0, -0.14]}>
        <extrudeGeometry args={[shieldShape, { depth: 0.28, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 24 }]} />
        {glossy(PERI)}
      </mesh>
      <group position={[0, -0.02, 0.26]} rotation={[0, 0, 0.0]}>
        <RoundedBox args={[0.14, 0.4, 0.08]} radius={0.04} position={[-0.17, -0.06, 0]} rotation={[0, 0, 0.8]}>{white}</RoundedBox>
        <RoundedBox args={[0.14, 0.7, 0.08]} radius={0.04} position={[0.14, 0.04, 0]} rotation={[0, 0, -0.8]}>{white}</RoundedBox>
      </group>
    </group>
  );
}

export function CoinStack() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <Coin key={i} scale={0.7} position={[(i % 2) * 0.1, -0.5 + i * 0.3, 0]} />
      ))}
      <mesh position={[0.85, -0.35, 0.3]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        {glossy(PERI, 0.6)}
      </mesh>
    </group>
  );
}

export function Bars() {
  const cols = ["#5b73e8", PERI, TEAL];
  return (
    <group position={[-0.7, -0.6, 0]}>
      {[0.6, 1.0, 1.5].map((h, i) => (
        <RoundedBox key={i} args={[0.4, h, 0.4]} radius={0.12} smoothness={6} position={[i * 0.7, h / 2, 0]}>
          {glossy(cols[i])}
        </RoundedBox>
      ))}
    </group>
  );
}

export function KeyHouse() {
  return (
    <group>
      <RoundedBox args={[1.2, 0.9, 0.9]} radius={0.14} smoothness={6} position={[0, -0.25, 0]}>{glossy(PERI)}</RoundedBox>
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 1]}>
        <coneGeometry args={[1, 0.7, 4]} />
        {glossy("#5b73e8")}
      </mesh>
      <RoundedBox args={[0.3, 0.5, 0.06]} radius={0.05} position={[0, -0.45, 0.47]}>{white}</RoundedBox>
      <mesh position={[0.9, -0.55, 0.5]} rotation={[0, 0, 0.6]}>
        <torusGeometry args={[0.2, 0.06, 12, 24]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} emissive={GOLD} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** Profile form: a card with lines and a check badge. */
export function Doc() {
  return (
    <group>
      <RoundedBox args={[1.1, 1.4, 0.2]} radius={0.12} smoothness={6}>{glossy(PERI)}</RoundedBox>
      {[0.35, 0.05, -0.25].map((y, i) => (
        <RoundedBox key={y} args={[i === 2 ? 0.4 : 0.7, 0.1, 0.06]} radius={0.04} position={[i === 2 ? -0.15 : 0, y, 0.13]}>{white}</RoundedBox>
      ))}
      <mesh position={[0.45, -0.55, 0.2]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        {glossy(TEAL, 0.6)}
      </mesh>
    </group>
  );
}

/** Risk gauge: a half ring with a needle. */
export function Gauge() {
  return (
    <group position={[0, -0.25, 0]}>
      <mesh>
        <torusGeometry args={[0.8, 0.17, 20, 48, Math.PI]} />
        {glossy(PERI)}
      </mesh>
      <mesh rotation={[0, 0, Math.PI * 0.18]}>
        <torusGeometry args={[0.8, 0.175, 20, 16, Math.PI * 0.34]} />
        {glossy(TEAL, 0.6)}
      </mesh>
      <RoundedBox args={[0.1, 0.72, 0.1]} radius={0.05} position={[0.26, 0.26, 0]} rotation={[0, 0, -0.75]}>{white}</RoundedBox>
      <mesh>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} emissive={GOLD} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** Briefing: a chat bubble with three dots. */
export function Chat() {
  return (
    <group>
      <RoundedBox args={[1.6, 1.05, 0.3]} radius={0.3} smoothness={8}>{glossy(TEAL, 0.5)}</RoundedBox>
      <mesh position={[-0.45, -0.62, 0]} rotation={[0, 0, Math.PI + 0.35]}>
        <coneGeometry args={[0.24, 0.34, 3]} />
        {glossy(TEAL, 0.5)}
      </mesh>
      {[-0.35, 0, 0.35].map((x) => (
        <mesh key={x} position={[x, 0, 0.19]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          {white}
        </mesh>
      ))}
    </group>
  );
}

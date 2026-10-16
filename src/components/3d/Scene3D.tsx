"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Poster } from "./Poster";

const CanvasShell = dynamic(() => import("./CanvasShell"), { ssr: false });

/**
 * Lazy 3D wrapper: mounts the canvas only when near the viewport, pauses it
 * when off-screen, and shows `poster` on mobile or with prefers-reduced-motion.
 * `children` must be a function so 3D nodes aren't created until the canvas exists.
 */
export function Scene3D({
  children,
  poster,
  label,
  className = "",
  camera,
  fov,
  allowMobile = false,
}: {
  children: () => ReactNode;
  poster?: ReactNode;
  label: string;
  className?: string;
  camera?: [number, number, number];
  fov?: number;
  allowMobile?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ok = () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      (allowMobile || !window.matchMedia("(max-width: 767px)").matches);
    const far = new IntersectionObserver(([e]) => e.isIntersecting && ok() && setNear(true), { rootMargin: "300px" });
    const vis = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    far.observe(el);
    vis.observe(el);
    return () => {
      far.disconnect();
      vis.disconnect();
    };
  }, [allowMobile]);

  return (
    <div ref={box} className={`relative ${className}`} role="img" aria-label={label}>
      {near ? (
        <CanvasShell active={visible} camera={camera} fov={fov}>
          {children()}
        </CanvasShell>
      ) : (
        (poster ?? <Poster label={label} />)
      )}
    </div>
  );
}

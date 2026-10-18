"use client";

import { useEffect, useRef, useState } from "react";
import { revealed } from "@/features/dashboard/lib/advisory";

const CHARS_PER_SECOND = 240;
const MAX_SECONDS = 4; // long answers speed up instead of making the user wait

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Reveals `text` letter by letter once it has arrived (the answer is already checked, so nothing unvetted is shown). */
export function useTypewriter(text: string, enabled: boolean, onProgress?: () => void) {
  const [n, setN] = useState(() => (enabled && !reducedMotion() ? 0 : text.length));
  const progress = useRef(onProgress);
  useEffect(() => {
    progress.current = onProgress;
  });
  useEffect(() => {
    if (!enabled || reducedMotion()) return;
    const perMs = Math.max(CHARS_PER_SECOND, text.length / MAX_SECONDS) / 1000;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(text.length, Math.floor((t - t0) * perMs));
      setN(k);
      progress.current?.();
      if (k < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled]);
  return { shown: revealed(text, n), typing: n < text.length };
}

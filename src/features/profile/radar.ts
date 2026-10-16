import type { FinancialHealth } from "./types";

export type Band = "red" | "yellow" | "green";

/** 0-40 red, 41-70 yellow, 71-100 green; decimals are rounded first so 40.4 is red and 40.5 is yellow. */
export function bandOf(score: number): Band {
  const s = Math.round(score);
  return s <= 40 ? "red" : s <= 70 ? "yellow" : "green";
}

export const BAND_CLASS: Record<Band, { text: string; bar: string; fill: string }> = {
  red: { text: "text-red-300", bar: "bg-red-400", fill: "fill-red-400" },
  yellow: { text: "text-amber-300", bar: "bg-amber-300", fill: "fill-amber-300" },
  green: { text: "text-gain", bar: "bg-gain", fill: "fill-gain" },
};

export const AXES = [
  { key: "financialSecurity", label: "Security" },
  { key: "financialSafety", label: "Safety" },
  { key: "financialGrowth", label: "Growth" },
  { key: "financialWisdom", label: "Wisdom" },
  { key: "financialFreedom", label: "Freedom" },
] as const satisfies readonly { key: keyof FinancialHealth; label: string }[];

export interface Pt {
  x: number;
  y: number;
}

/** Point at angle of axis i (first axis straight up, clockwise) at radius fraction value/100. */
export function axisPoint(i: number, n: number, value: number, cx: number, cy: number, r: number): Pt {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
  const k = (Math.min(Math.max(value, 0), 100) / 100) * r;
  return { x: +(cx + k * Math.cos(a)).toFixed(2), y: +(cy + k * Math.sin(a)).toFixed(2) };
}

export const polygonPoints = (values: number[], cx: number, cy: number, r: number) =>
  values.map((v, i) => axisPoint(i, values.length, v, cx, cy, r));

export const toPath = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

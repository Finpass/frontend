import type { Lang } from "@/features/profile/types";
import type { SuitabilityRecord } from "@/features/dashboard/types";

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;

/** "bbca.jk, BBRI.JK,,bbca.jk" -> ["BBCA.JK", "BBRI.JK"]; at most MAX_COMPARE, in order of first appearance. */
export function parseSymbols(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (raw ?? "").split(",")) {
    const s = part.trim().toUpperCase();
    if (s) seen.add(s);
  }
  return [...seen].slice(0, MAX_COMPARE);
}

/** Adds a symbol (up to MAX_COMPARE) or removes it when already picked. */
export function toggleSymbol(list: string[], symbol: string): string[] {
  const s = symbol.toUpperCase();
  if (list.includes(s)) return list.filter((x) => x !== s);
  return list.length >= MAX_COMPARE ? list : [...list, s];
}

/** Index of the leading value, or -1 when fewer than two values exist or they are all equal. */
export function leaderIndex(values: (number | null)[], higherIsBetter: boolean): number {
  const present = values.filter((v): v is number => v !== null);
  if (present.length < 2 || present.every((v) => v === present[0])) return -1;
  const target = higherIsBetter ? Math.max(...present) : Math.min(...present);
  return values.indexOf(target);
}

export function num(v: number | null | undefined, digits = 1, suffix = ""): string {
  return v === null || v === undefined || Number.isNaN(v) ? "-" : `${v.toFixed(digits)}${suffix}`;
}

/** The question the advisor page pre-fills; the user still presses send. */
export function askQuestion(symbols: string[], lang: Lang): string {
  const list = symbols.join(", ");
  return lang === "id"
    ? `Jelaskan perbedaan utama ${list} untuk profil saya, termasuk risiko dan trade-off-nya.`
    : `Explain the main differences between ${list} for my profile, including the risks and trade-offs.`;
}

/** One-line description of an audit record. */
export function recordSummary(r: SuitabilityRecord, lang: Lang): string {
  const p = r.payload;
  if (r.kind === "comparison") {
    const assets = Array.isArray(p.assets) ? (p.assets as { symbol?: string }[]).map((a) => a.symbol).filter(Boolean) : [];
    const best = typeof p.best === "string" && p.best ? p.best : "-";
    return lang === "id" ? `${assets.join(" vs ")}. Paling cocok: ${best}` : `${assets.join(" vs ")}. Best fit: ${best}`;
  }
  const t = (p.target ?? {}) as Record<string, number>;
  const top = Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}%`);
  return `${lang === "id" ? "Alokasi target" : "Target allocation"}: ${top.join(", ") || "-"}`;
}

/** Reads ?<key>=A,B and ?ask= from the page's search params. */
export function fromParams(qs: { get(name: string): string | null }, key: "symbols" | "compare"): { symbols: string[]; ask: string } {
  return { symbols: parseSymbols(qs.get(key)), ask: qs.get("ask") ?? "" };
}

/** Colours for up to four compared assets (the Finpass accent, teal, violet and amber tokens). */
export const SERIES_HEX = ["#8ea2ff", "#2dd4bf", "#a78bfa", "#fbbf24"] as const;

/** Point on a radar: axis i of n, value 0 to 100 mapped onto radius r around (cx, cy), axis 0 pointing up. */
export function radarPoint(i: number, n: number, value: number, r: number, cx: number, cy: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const k = (Math.min(100, Math.max(0, value)) / 100) * r;
  return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
}

/** Round axis bounds and step around [min, max]; always spans a positive range. */
export function niceRange(min: number, max: number, ticks = 4): { lo: number; hi: number; step: number } {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step || step, step };
}

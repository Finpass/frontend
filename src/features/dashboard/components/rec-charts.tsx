"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { colors } from "@/design-system/colors";
import { evenX, nearestIndex, niceTicks, paddedDomain, scale, smoothPath, areaPath, type Pt } from "@/features/dashboard/lib/charts";
import { compactIdr, idr, pct as fmtPct } from "@/features/dashboard/lib/format";
import type { ProjectionPoint } from "@/features/dashboard/lib/projection";
import { useDash } from "@/features/dashboard/state/use-dash";

const axisText = "fill-ink/60 text-[14px]";

export function ProjectionChart({ points, years }: { points: ProjectionPoint[]; years: number }) {
  const { lang, t } = useDash();
  const m = t.match;
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 280, L = 78, R = 12, T = 14, B = 32;
  const [lo, hi] = paddedDomain(points.flatMap((p) => [p.low, p.high]), 0.08);
  const nt = niceTicks(hi - lo, 4);
  const step = nt.length > 1 ? nt[1] - nt[0] : 1;
  const yTicks: number[] = [];
  for (let v = Math.floor(lo / step) * step; v < hi + step; v += step) yTicks.push(v);
  const y = scale(yTicks[0], yTicks[yTicks.length - 1], H - B, T);
  const xs = evenX(points.length, L, W - R);
  const line = (k: "base" | "low" | "high"): Pt[] => points.map((p, i) => [xs[i], y(p[k])]);
  const base = line("base"), low = line("low"), high = line("high");
  const baseP = smoothPath(base);
  const idx = hover;
  const cur = idx === null ? null : points[idx];
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(nearestIndex(((e.clientX - r.left) / r.width) * W, points.length, L, W - R));
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setHover((i) => Math.min((i ?? -1) + 12, points.length - 1));
    else if (e.key === "ArrowLeft") setHover((i) => Math.max((i ?? points.length) - 12, 0));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };
  const last = points[points.length - 1];
  const aria = m.chartAria.replace("{n}", String(years)).replace("{low}", idr(last.low)).replace("{base}", idr(last.base)).replace("{high}", idr(last.high));
  const yearLabel = (mo: number) => (mo === 0 ? m.now : m.yearShort.replace("{n}", String(mo / 12)));
  const labelStep = years > 5 ? 2 : 1;
  const label = (cur: ProjectionPoint) => (cur.month % 12 === 0 ? yearLabel(cur.month) : m.monthN.replace("{n}", String(cur.month)));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} tabIndex={0} onPointerMove={move} onPointerLeave={() => setHover(null)} onKeyDown={key} onBlur={() => setHover(null)}
        className="h-auto w-full touch-pan-y rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80">
        <defs>
          <linearGradient id={`${uid}b`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={colors.teal} stopOpacity="0.3" />
            <stop offset="1" stopColor={colors.teal} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tk) => (
          <g key={tk}>
            <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} stroke={colors.stroke} strokeDasharray="3 4" />
            <text x={L - 8} y={y(tk) + 4} textAnchor="end" className={axisText}>{compactIdr(tk, lang)}</text>
          </g>
        ))}
        <path d={areaPath(baseP, base[0], base[base.length - 1], H - B)} fill={`url(#${uid}b)`} />
        <path d={smoothPath(high)} fill="none" stroke={colors.cyan} strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" />
        <path d={smoothPath(low)} fill="none" stroke={colors.loss} strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" />
        <path d={baseP} fill="none" stroke={colors.teal} strokeWidth="2.2" strokeLinecap="round" />
        {points.map((p, i) => p.month % (12 * labelStep) === 0 && <text key={i} x={xs[i]} y={H - 10} textAnchor="middle" className={axisText}>{yearLabel(p.month)}</text>)}
        {idx !== null && (
          <g pointerEvents="none">
            <line x1={xs[idx]} x2={xs[idx]} y1={T} y2={H - B} stroke={colors.accent} strokeDasharray="3 3" />
            <circle cx={xs[idx]} cy={high[idx][1]} r="4" fill={colors.cyan} stroke={colors.surface} strokeWidth="2" />
            <circle cx={xs[idx]} cy={base[idx][1]} r="4.5" fill={colors.teal} stroke={colors.surface} strokeWidth="2" />
            <circle cx={xs[idx]} cy={low[idx][1]} r="4" fill={colors.loss} stroke={colors.surface} strokeWidth="2" />
          </g>
        )}
      </svg>
      <div aria-live="polite" className="sr-only">{cur ? `${label(cur)}: ${idr(cur.low)}, ${idr(cur.base)}, ${idr(cur.high)}` : ""}</div>
      {cur && idx !== null && (
        <div aria-hidden className="pointer-events-none absolute top-2 z-10 w-max min-w-48 rounded-xl border border-stroke bg-paper/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: `${(xs[idx] / W) * 100}%`, transform: `translateX(${idx > points.length * 0.6 ? "-105%" : "5%"})` }}>
          <p className="font-semibold">{label(cur)}</p>
          {([["high", m.optimistic, "bg-cyan"], ["base", m.expected, "bg-teal"], ["low", m.cautious, "bg-loss"]] as const).map(([k, name, dot]) => (
            <p key={k} className="mt-1 flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-ink/70"><i className={`size-2 rounded-full ${dot}`} />{name}</span><b>{idr(cur[k])}</b></p>
          ))}
        </div>
      )}
    </div>
  );
}

export interface Slice {
  key: string;
  label: string;
  pct: number;
  color: string;
}

/** Donut with the headline in the middle. Hovering a slice or its legend row highlights it and shows its share instead. */
export function Donut({ slices, center, sub }: { slices: Slice[]; center: string; sub: string }) {
  const { lang } = useDash();
  const [hover, setHover] = useState<string | null>(null);
  const R = 15.915; // circumference 100, so dash lengths read as percents
  const total = slices.reduce((s, x) => s + x.pct, 0) || 1;
  const arcs = slices.map((s, i) => {
    const len = Math.max((s.pct / total) * 100 - 0.8, 0);
    const start = slices.slice(0, i).reduce((x, y) => x + (y.pct / total) * 100, 0);
    return { s, len, start };
  });
  const on = slices.find((s) => s.key === hover);
  const fade = (key: string) => (hover && hover !== key ? 0.35 : 1);
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:items-center xl:flex-col 2xl:flex-row">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 42 42" role="img" aria-label={slices.map((s) => `${s.label} ${fmtPct(s.pct, lang, { digits: 1 })}`).join(", ")} className="size-full -rotate-90">
          <circle cx="21" cy="21" r={R} fill="none" stroke={colors.stroke} strokeWidth="4.5" opacity="0.5" />
          {arcs.map(({ s, len, start }) => (
            <circle
              key={s.key}
              cx="21" cy="21" r={R} fill="none" stroke={s.color} strokeLinecap="round"
              strokeWidth={hover === s.key ? 6 : 4.5}
              strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={-(start + 0.4)}
              opacity={fade(s.key)}
              className="cursor-pointer transition-all duration-200 motion-reduce:transition-none"
              onPointerEnter={() => setHover(s.key)} onPointerLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-xl font-bold tracking-tight" style={on ? { color: on.color } : undefined}>{on ? fmtPct(on.pct, lang, { digits: 1 }) : center}</p>
          <p className="max-w-24 truncate text-[11px] text-ink/65">{on ? on.label : sub}</p>
        </div>
      </div>
      <ul className="w-full max-w-56 space-y-0.5 text-sm">
        {slices.map((s) => (
          <li
            key={s.key}
            onPointerEnter={() => setHover(s.key)} onPointerLeave={() => setHover(null)}
            className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors ${hover === s.key ? "bg-field" : ""}`}
            style={{ opacity: fade(s.key) }}
          >
            <span className="flex min-w-0 items-center gap-2"><i aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} /><span className="truncate">{s.label}</span></span>
            <span className="font-semibold">{fmtPct(s.pct, lang, { digits: 1 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

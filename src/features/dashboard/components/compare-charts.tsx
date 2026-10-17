"use client";

import { SERIES_HEX, niceRange, radarPoint } from "@/features/dashboard/lib/compare";
import { axisLabels } from "@/features/dashboard/lib/format";
import { useDash } from "@/features/dashboard/state/use-dash";
import type { CompareAsset } from "@/features/dashboard/types";

const GRID = "#1c263b"; // design-system stroke
const MUTED = "#8b94ad";
const COMPONENTS = ["risk_fit", "return_quality", "cost_efficiency", "liquidity", "fundamentals", "goal_alignment", "macro_fit"] as const;

const sign = (v: number, d = 1) => `${v > 0 ? "+" : ""}${v.toFixed(d)}%`;

/** Seven fit components of every asset on one radar: the shape shows where each asset is strong or weak. */
export function RadarCompare({ assets }: { assets: CompareAsset[] }) {
  const { t } = useDash();
  const c = t.cp;
  const W = 380, H = 330, cx = W / 2, cy = 160, R = 100, n = COMPONENTS.length;
  const poly = (vals: number[]) => vals.map((v, i) => radarPoint(i, n, v, R, cx, cy).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.radarTitle}: ${assets.map((a) => `${a.symbol} ${a.score.total.toFixed(1)}`).join(", ")}`} className="mx-auto h-auto w-full max-w-md">
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} points={poly(COMPONENTS.map(() => ring))} fill="none" stroke={GRID} strokeWidth={ring === 100 ? 1.2 : 0.8} />
      ))}
      {COMPONENTS.map((k, i) => {
        const [x, y] = radarPoint(i, n, 100, R, cx, cy);
        const [lx, ly] = radarPoint(i, n, 100, R + 22, cx, cy);
        return (
          <g key={k}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={GRID} strokeWidth={0.8} />
            <text x={lx} y={ly} textAnchor={lx < cx - 4 ? "end" : lx > cx + 4 ? "start" : "middle"} dominantBaseline="middle" fontSize={11} fill={MUTED}>{c.comp[k]}</text>
          </g>
        );
      })}
      {assets.map((a, i) => {
        const vals = COMPONENTS.map((k) => a.score.components[k] ?? 0);
        return (
          <g key={a.symbol}>
            <polygon points={poly(vals)} fill={SERIES_HEX[i]} fillOpacity={0.14} stroke={SERIES_HEX[i]} strokeWidth={1.8} strokeLinejoin="round" />
            {vals.map((v, j) => {
              const [x, y] = radarPoint(j, n, v, R, cx, cy);
              return <circle key={j} cx={x} cy={y} r={2.6} fill={SERIES_HEX[i]} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** One year of closes, each rebased to 100, on a shared time axis; the end label is the total change. */
export function PerfLines({ assets }: { assets: CompareAsset[] }) {
  const { t, lang } = useDash();
  const c = t.cp;
  const lines = assets.map((a, i) => ({ a, i, s: a.series ?? [] })).filter((l) => l.s.length > 1);
  if (lines.length === 0) return <p className="py-10 text-center text-sm text-ink/70">{c.noSeries}</p>;
  const W = 800, H = 300, L = 44, Rm = 120, T = 14, B = 30;
  const all = lines.flatMap((l) => l.s);
  const t0 = Math.min(...all.map((p) => Date.parse(p.d)));
  const t1 = Math.max(...all.map((p) => Date.parse(p.d)));
  const { lo, hi, step } = niceRange(Math.min(100, ...all.map((p) => p.v)), Math.max(100, ...all.map((p) => p.v)));
  const X = (d: string) => L + ((Date.parse(d) - t0) / (t1 - t0 || 1)) * (W - L - Rm);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  const longest = lines.reduce((m, l) => (l.s.length > m.s.length ? l : m)).s;
  const labels = axisLabels(longest.map((p) => p.d), lang, 6);
  // end labels sit at the last point; push apart the ones that would overlap
  const ends = lines.map((l) => ({ ...l, y: Y(l.s[l.s.length - 1].v) })).sort((x, y) => x.y - y.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.perfTitle}: ${lines.map((l) => `${l.a.symbol} ${sign(l.s[l.s.length - 1].v - 100)}`).join(", ")}`} className="h-auto w-full">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} y1={Y(v)} x2={W - Rm} y2={Y(v)} stroke={v === 100 ? MUTED : GRID} strokeWidth={v === 100 ? 1 : 0.8} strokeDasharray={v === 100 ? "4 4" : undefined} />
          <text x={L - 8} y={Y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={MUTED}>{Math.round(v)}</text>
        </g>
      ))}
      {[...labels].map(([idx, text]) => (
        <text key={idx} x={X(longest[idx].d)} y={H - 8} textAnchor="middle" fontSize={11} fill={MUTED}>{text}</text>
      ))}
      {lines.map(({ a, i, s }) => (
        <polyline key={a.symbol} points={s.map((p) => `${X(p.d)},${Y(p.v)}`).join(" ")} fill="none" stroke={SERIES_HEX[i]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {ends.map(({ a, i, s, y }) => {
        const last = s[s.length - 1];
        return (
          <g key={a.symbol}>
            <circle cx={X(last.d)} cy={Y(last.v)} r={3.2} fill={SERIES_HEX[i]} />
            <text x={X(last.d) + 8} y={y} dominantBaseline="middle" fontSize={11} fontWeight={600} fill={SERIES_HEX[i]}>{a.symbol} {sign(last.v - 100)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Volatility against 1-year return; bubble size is the fit score. Up and to the left is better. */
export function RiskReturn({ assets }: { assets: CompareAsset[] }) {
  const { t } = useDash();
  const c = t.cp;
  const W = 380, H = 330, L = 48, Rm = 24, T = 16, B = 44;
  const xs = assets.map((a) => a.metrics.volatility);
  const ys = assets.map((a) => a.metrics.return1y);
  const xr = niceRange(0, Math.max(...xs) * 1.1);
  const yr = niceRange(Math.min(0, ...ys), Math.max(0, ...ys));
  const X = (v: number) => L + ((v - xr.lo) / (xr.hi - xr.lo)) * (W - L - Rm);
  const Y = (v: number) => T + (1 - (v - yr.lo) / (yr.hi - yr.lo)) * (H - T - B);
  const xt: number[] = [], yt: number[] = [];
  for (let v = xr.lo; v <= xr.hi + 1e-9; v += xr.step) xt.push(v);
  for (let v = yr.lo; v <= yr.hi + 1e-9; v += yr.step) yt.push(v);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.scatterTitle}: ${assets.map((a) => `${a.symbol} ${sign(a.metrics.return1y)}, ${a.metrics.volatility.toFixed(1)}%`).join("; ")}`} className="mx-auto h-auto w-full max-w-md">
      {yt.map((v) => (
        <g key={`y${v}`}>
          <line x1={L} y1={Y(v)} x2={W - Rm} y2={Y(v)} stroke={v === 0 ? MUTED : GRID} strokeWidth={v === 0 ? 1 : 0.8} strokeDasharray={v === 0 ? "4 4" : undefined} />
          <text x={L - 8} y={Y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={MUTED}>{Math.round(v)}</text>
        </g>
      ))}
      {xt.map((v) => (
        <g key={`x${v}`}>
          <line x1={X(v)} y1={T} x2={X(v)} y2={H - B} stroke={GRID} strokeWidth={0.8} />
          <text x={X(v)} y={H - B + 16} textAnchor="middle" fontSize={11} fill={MUTED}>{Math.round(v)}</text>
        </g>
      ))}
      <text x={(L + W - Rm) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill={MUTED}>{c.axisVol}</text>
      <text transform={`translate(12 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill={MUTED}>{c.axisRet}</text>
      {assets.map((a, i) => {
        const x = X(a.metrics.volatility), y = Y(a.metrics.return1y), r = 7 + (a.score.total / 100) * 9;
        const flip = x > W - Rm - 70;
        return (
          <g key={a.symbol}>
            <circle cx={x} cy={y} r={r} fill={SERIES_HEX[i]} fillOpacity={0.28} stroke={SERIES_HEX[i]} strokeWidth={1.8} />
            <text x={flip ? x - r - 5 : x + r + 5} y={y} textAnchor={flip ? "end" : "start"} dominantBaseline="middle" fontSize={11} fontWeight={600} fill={SERIES_HEX[i]}>{a.symbol}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Fit score as a ring, so the headline number reads at a glance. */
export function ScoreRing({ value, color }: { value: number; color: string }) {
  const r = 26, len = 2 * Math.PI * r, v = Math.min(100, Math.max(0, value));
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke={GRID} strokeWidth={6} />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${(v / 100) * len} ${len}`} transform="rotate(-90 32 32)" />
    </svg>
  );
}

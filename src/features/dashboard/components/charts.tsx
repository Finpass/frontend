"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { colors } from "@/design-system/colors";
import { areaPath, downsample, evenX, labelIndexes, linePath, nearestIndex, niceTicks, paddedDomain, scale, smoothPath, type Pt } from "@/features/dashboard/lib/charts";
import { compactIdr, idr, monthLabel, monthYear, shortDate } from "@/features/dashboard/lib/format";
import { CLASS_COLORS, type AllocationRow } from "@/features/dashboard/lib/holdings";
import { useDash } from "@/features/dashboard/state/use-dash";
import type { PerformancePoint, TrendPoint } from "@/features/dashboard/types";

const axisText = "fill-ink/60 text-[14px]";

export function Sparkline({ values, color, height = 36, fill = true, label }: { values: number[]; color: string; height?: number; fill?: boolean; label?: string }) {
  const gid = useId();
  const W = 100;
  const v = values.length > 1 ? values : [0, 0];
  const [lo, hi] = paddedDomain(v, 0.15);
  const xs = evenX(v.length, 1, W - 1);
  const y = scale(lo, hi, height - 2, 2);
  const pts: Pt[] = v.map((n, i) => [xs[i], y(n)]);
  const line = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="h-full w-full overflow-visible">
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.25" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath(line, pts[0], pts[pts.length - 1], height)} fill={`url(#${gid})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

const MAX_BARS = 24;

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const { lang, t } = useDash();
  const gid = useId();
  const data = downsample(points, MAX_BARS);
  const W = 520;
  const H = 280;
  const L = 78;
  const R = 8;
  const T = 12;
  const B = 34;
  const ticks = niceTicks(Math.max(...data.map((p) => Math.max(p.totalAssets, p.investmentValue)), 0));
  const top = ticks[ticks.length - 1];
  const y = scale(0, top, H - B, T);
  const slot = (W - L - R) / data.length;
  const bw = Math.min(slot * 0.62, 34);
  const cx = (i: number) => L + slot * (i + 0.5);
  const showLabel = labelIndexes(data.length, 8);
  const lineP: Pt[] = data.map((p, i) => [cx(i), y(p.investmentValue)]);
  const last = data[data.length - 1];
  const first = data[0];
  const aria = t.trend.chart
    .replace("{from}", monthYear(first.date, lang))
    .replace("{to}", monthYear(last.date, lang))
    .replace("{total}", idr(last.totalAssets))
    .replace("{invest}", idr(last.investmentValue));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="h-auto w-full">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={colors.accent} />
          <stop offset="1" stopColor={colors.accent} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} stroke={colors.stroke} strokeDasharray={tk === 0 ? undefined : "3 4"} />
          <text x={L - 8} y={y(tk) + 4} textAnchor="end" className={axisText}>{tk === 0 ? "Rp 0" : compactIdr(tk, lang)}</text>
        </g>
      ))}
      {data.map((p, i) => (
        <g key={p.date + i}>
          <rect x={cx(i) - bw / 2} y={y(p.totalAssets)} width={bw} height={Math.max(H - B - y(p.totalAssets), 0)} rx="4" fill={`url(#${gid})`} />
          {showLabel.has(i) && <text x={cx(i)} y={H - 12} textAnchor="middle" className={axisText}>{monthLabel(p.date, lang)}</text>}
        </g>
      ))}
      <path d={linePath(lineP)} fill="none" stroke={colors.teal} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {lineP.map(([x, yy], i) => (
        <circle key={i} cx={x} cy={yy} r={i === lineP.length - 1 ? 7 : 5} fill={colors.teal} stroke="#fff" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

export function PerformanceChart({ points }: { points: PerformancePoint[] }) {
  const { lang, t } = useDash();
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const data = downsample(points, 90);
  const W = 560;
  const H = 280;
  const L = 78;
  const R = 12;
  const T = 14;
  const B = 32;
  const [lo, hi] = paddedDomain(data.flatMap((p) => [p.value, p.cost]), 0.12);
  const nt = niceTicks(hi - lo, 4);
  const stepSize = nt.length > 1 ? nt[1] - nt[0] : 1;
  const base = Math.floor(lo / stepSize) * stepSize;
  const yTicks: number[] = [];
  for (let v = base; v < hi + stepSize; v += stepSize) yTicks.push(v);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  const y = scale(yMin, yMax, H - B, T);
  const xs = evenX(data.length, L, W - R);
  const val: Pt[] = data.map((p, i) => [xs[i], y(p.value)]);
  const cost: Pt[] = data.map((p, i) => [xs[i], y(p.cost)]);
  const showLabel = labelIndexes(data.length, 7);
  // month ticks only when the label changes, so a daily series is not labelled twenty times as "Okt"
  const labelAt = (i: number) => showLabel.has(i) && (i === 0 || monthLabel(data[i].date, lang) !== monthLabel(data[i - 1].date, lang) || data.length < 8);

  const idx = hover;
  const cur = idx === null ? null : data[idx];
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(nearestIndex(((e.clientX - r.left) / r.width) * W, data.length, L, W - R));
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setHover((i) => Math.min((i ?? -1) + 1, data.length - 1));
    else if (e.key === "ArrowLeft") setHover((i) => Math.max((i ?? data.length) - 1, 0));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };

  const first = data[0];
  const last = data[data.length - 1];
  const aria = t.pf.perfChart
    .replace("{from}", shortDate(first.date, lang))
    .replace("{to}", shortDate(last.date, lang))
    .replace("{value}", idr(last.value))
    .replace("{cost}", idr(last.cost));
  const lineV = smoothPath(val);
  const lineC = smoothPath(cost);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={aria}
        tabIndex={0}
        onPointerMove={move}
        onPointerLeave={() => setHover(null)}
        onKeyDown={key}
        onBlur={() => setHover(null)}
        className="h-auto w-full touch-pan-y rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80"
      >
        <defs>
          <linearGradient id={`${uid}v`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={colors.teal} stopOpacity="0.35" />
            <stop offset="1" stopColor={colors.teal} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}c`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={colors.blue} stopOpacity="0.3" />
            <stop offset="1" stopColor={colors.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tk) => (
          <g key={tk}>
            <line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} stroke={colors.stroke} strokeDasharray="3 4" />
            <text x={L - 8} y={y(tk) + 4} textAnchor="end" className={axisText}>{tk === 0 ? "Rp 0" : compactIdr(tk, lang)}</text>
          </g>
        ))}
        <path d={areaPath(lineV, val[0], val[val.length - 1], H - B)} fill={`url(#${uid}v)`} />
        <path d={areaPath(lineC, cost[0], cost[cost.length - 1], H - B)} fill={`url(#${uid}c)`} />
        <path d={lineC} fill="none" stroke={colors.blue} strokeWidth="2" strokeLinecap="round" />
        <path d={lineV} fill="none" stroke={colors.teal} strokeWidth="2" strokeLinecap="round" />
        {data.map((p, i) => labelAt(i) && <text key={i} x={xs[i]} y={H - 10} textAnchor="middle" className={axisText}>{monthLabel(p.date, lang)}</text>)}
        {idx !== null && (
          <g pointerEvents="none">
            <line x1={xs[idx]} x2={xs[idx]} y1={T} y2={H - B} stroke={colors.accent} strokeDasharray="3 3" />
            <circle cx={xs[idx]} cy={val[idx][1]} r="4.5" fill={colors.teal} stroke={colors.surface} strokeWidth="2" />
            <circle cx={xs[idx]} cy={cost[idx][1]} r="4.5" fill={colors.blue} stroke={colors.surface} strokeWidth="2" />
          </g>
        )}
      </svg>
      <div aria-live="polite" className="sr-only">{cur ? `${shortDate(cur.date, lang)}: ${t.pf.valueLegend} ${idr(cur.value)}, ${t.pf.costLegend} ${idr(cur.cost)}` : ""}</div>
      {cur && idx !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 z-10 w-max min-w-44 rounded-xl border border-stroke bg-paper/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: `${(xs[idx] / W) * 100}%`, transform: `translateX(${idx > data.length * 0.6 ? "-105%" : "5%"})` }}
        >
          <p className="font-semibold">{monthYear(cur.date, lang)}</p>
          <p className="mt-1 flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-ink/70"><i className="size-2 rounded-full bg-teal" />{t.pf.valueLegend}</span><b>{idr(cur.value)}</b></p>
          <p className="mt-0.5 flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-ink/70"><i className="size-2 rounded-full bg-blue" />{t.pf.costLegend}</span><b>{idr(cur.cost)}</b></p>
        </div>
      )}
    </div>
  );
}

export function AllocationLegend({ rows, label }: { rows: AllocationRow[]; label: string }) {
  const { lang } = useDash();
  const fmt = (n: number) => `${(Math.round(n * 10) / 10).toString().replace(".", lang === "id" ? "," : ".")}%`;
  return (
    <ul aria-label={label} className="space-y-2 text-sm">
      {rows.map((r, i) => (
        <li key={r.key} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><i aria-hidden className="size-2.5 rounded-full" style={{ background: CLASS_COLORS[i % CLASS_COLORS.length] }} />{r.label}</span>
          <span className="font-semibold">{fmt(r.pct)}</span>
        </li>
      ))}
    </ul>
  );
}

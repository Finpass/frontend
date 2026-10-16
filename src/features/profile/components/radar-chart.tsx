import { useProfileLang } from "@/features/profile/state/use-lang";
import type { FinancialHealth } from "@/features/profile/types";
import { AXES, BAND_CLASS, axisPoint, bandOf, polygonPoints, toPath } from "@/features/profile/radar";

const SIZE = 380;
const C = SIZE / 2;
const R = 100;

export function RadarChart({ health }: { health: FinancialHealth }) {
  const { t } = useProfileLang();
  const values = AXES.map((a) => health[a.key]);
  const names = AXES.map((a) => t.result.axes[a.key]);
  const label = t.result.radarLabel.replace("{list}", names.map((n, i) => `${n} ${Math.round(values[i])}`).join(", "));
  const rings = [40, 70, 100];

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} className="mx-auto h-auto w-full max-w-sm">
      {rings.map((r) => (
        <polygon key={r} points={toPath(polygonPoints(values.map(() => r), C, C, R))} className="fill-none stroke-stroke" strokeDasharray={r === 100 ? undefined : "3 3"} />
      ))}
      {values.map((_, i) => {
        const p = axisPoint(i, values.length, 100, C, C, R);
        return <line key={i} x1={C} y1={C} x2={p.x} y2={p.y} className="stroke-stroke" />;
      })}
      <polygon points={toPath(polygonPoints(values, C, C, R))} className="fill-accent/20 stroke-accent" strokeWidth={2} strokeLinejoin="round" />
      {values.map((v, i) => {
        const p = axisPoint(i, values.length, v, C, C, R);
        return <circle key={i} cx={p.x} cy={p.y} r={5} className={`${BAND_CLASS[bandOf(v)].fill} stroke-paper`} strokeWidth={2} />;
      })}
      {names.map((n, i) => {
        const p = axisPoint(i, values.length, 100, C, C, R + 22);
        const anchor = Math.abs(p.x - C) < 4 ? "middle" : p.x > C ? "start" : "end";
        return (
          <text key={n} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle" className="fill-ink text-[11px] font-semibold">
            {n}
          </text>
        );
      })}
    </svg>
  );
}

export type Pt = [number, number];

/** Rounded axis ticks from 0 up to a "nice" top that covers max. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  const n = Math.ceil(max / step - 1e-9);
  return Array.from({ length: n + 1 }, (_, i) => +(i * step).toPrecision(12));
}

/** Min/max padded so a line chart does not hug the frame; flat series get a fake range. */
export function paddedDomain(values: number[], pad = 0.1): [number, number] {
  if (!values.length) return [0, 1];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (lo === hi) return [lo - Math.abs(lo || 1) * 0.1, hi + Math.abs(hi || 1) * 0.1];
  const d = (hi - lo) * pad;
  return [lo - d, hi + d];
}

export const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** n evenly spaced x positions across [x0, x1]; a single point sits in the middle. */
export const evenX = (n: number, x0: number, x1: number): number[] =>
  Array.from({ length: n }, (_, i) => (n === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (n - 1)));

const f = (n: number) => +n.toFixed(2);

export const linePath = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ");

/** Monotone cubic (Fritsch-Carlson): smooth, never overshoots the data. */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  if (n < 3) return linePath(pts);
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push(dx[i] === 0 ? 0 : (pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      t[i] = (3 * a * m[i]) / h;
      t[i + 1] = (3 * b * m[i]) / h;
    }
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const w = dx[i] / 3;
    d += ` C${f(pts[i][0] + w)} ${f(pts[i][1] + t[i] * w)} ${f(pts[i + 1][0] - w)} ${f(pts[i + 1][1] - t[i + 1] * w)} ${f(pts[i + 1][0])} ${f(pts[i + 1][1])}`;
  }
  return d;
}

/** Closes a line path down to the baseline so it can be filled. */
export const areaPath = (line: string, first: Pt, last: Pt, baseY: number) =>
  `${line} L${f(last[0])} ${f(baseY)} L${f(first[0])} ${f(baseY)} Z`;

/** Keeps at most max points, always including the first and last. */
export function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max || max < 2) return arr;
  return Array.from({ length: max }, (_, i) => arr[Math.round((i * (arr.length - 1)) / (max - 1))]);
}

/** Indexes (of n) that should carry an x-axis label, at most `max`, including first and last. */
export function labelIndexes(n: number, max: number): Set<number> {
  if (n <= max) return new Set(Array.from({ length: n }, (_, i) => i));
  return new Set(Array.from({ length: max }, (_, i) => Math.round((i * (n - 1)) / (max - 1))));
}

/** Index of the evenly spaced point nearest to x. */
export function nearestIndex(x: number, n: number, x0: number, x1: number): number {
  if (n <= 1 || x1 === x0) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(((x - x0) / (x1 - x0)) * (n - 1))));
}

export const percentChange = (from: number, to: number) => (from === 0 ? 0 : ((to - from) / Math.abs(from)) * 100);

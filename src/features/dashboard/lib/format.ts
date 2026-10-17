import { formatNumber } from "@/features/profile/numeric";
import type { Lang } from "@/features/profile/types";

const sep = (lang: Lang) => (lang === "id" ? "," : ".");

/** "Rp 120.000.000"; negatives as "-Rp 1.000". */
export const idr = (n: number) => `${n < 0 ? "-" : ""}Rp ${formatNumber(Math.abs(Math.round(n)))}`;

export const signedIdr = (n: number) => `${n < 0 ? "-" : "+"}Rp ${formatNumber(Math.abs(Math.round(n)))}`;

/** Fixed decimals with the language's decimal separator and no thousands grouping beyond the integer part. */
export function decimal(n: number, digits: number, lang: Lang): string {
  const [int, frac] = Math.abs(n).toFixed(digits).split(".");
  const body = formatNumber(Number(int)) + (frac ? sep(lang) + frac : "");
  return (n < 0 && Number(Math.abs(n).toFixed(digits)) !== 0 ? "-" : "") + body;
}

export function pct(n: number, lang: Lang, o: { digits?: number; sign?: boolean } = {}): string {
  const s = decimal(n, o.digits ?? 1, lang);
  return `${o.sign && !s.startsWith("-") ? "+" : ""}${s}%`;
}

const COMPACT: Record<Lang, [number, string][]> = {
  id: [[1e12, "T"], [1e9, "M"], [1e6, "jt"], [1e3, "rb"]],
  en: [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]],
};

/** "Rp 150 jt", "Rp 1,5 M". Values under 1.000 stay whole. */
export function compactIdr(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const neg = n < 0 ? "-" : "";
  const hit = COMPACT[lang].find(([u]) => abs >= u);
  if (!hit) return `${neg}Rp ${Math.round(abs)}`;
  const v = Math.round((abs / hit[0]) * 10) / 10;
  const text = Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", sep(lang));
  return `${neg}Rp ${text} ${hit[1]}`;
}

/** Parses a user-typed decimal ("1.234,56", "1234.5", "10"). Null when invalid or empty. */
export function parseDecimal(raw: string): number | null {
  let s = raw.trim().replace(/\s+/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const MONTHS: Record<Lang, string[]> = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const ymd = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
};

/** "Mei" from "2026-05-31". */
export function monthLabel(date: string, lang: Lang): string {
  const p = ymd(date);
  return p ? MONTHS[lang][p.m] : date;
}

/** "Okt 2026". */
export function monthYear(date: string, lang: Lang): string {
  const p = ymd(date);
  return p ? `${MONTHS[lang][p.m]} ${p.y}` : date;
}

/** "17 Okt 2026". */
export function shortDate(date: string, lang: Lang): string {
  const p = ymd(date);
  return p ? `${p.d} ${MONTHS[lang][p.m]} ${p.y}` : date;
}

/**
 * X-axis labels for a daily series: index -> text. Short ranges (up to two months) get evenly spaced "5 Apr" labels;
 * longer ones get the first point of each month (thinned to at most `max`), with a year suffix when the span passes a year.
 */
export function axisLabels(dates: string[], lang: Lang, max = 6): Map<number, string> {
  const out = new Map<number, string>();
  const n = dates.length;
  if (n === 0) return out;
  const parts = dates.map(ymd);
  const days = (Date.parse(dates[n - 1]) - Date.parse(dates[0])) / 86_400_000;
  if (!(days > 62)) {
    const k = Math.min(n, Math.max(max - 2, 2)); // day labels are wider than month labels, so fewer fit
    for (let i = 0; i < k; i++) {
      const idx = k === 1 ? 0 : Math.round((i * (n - 1)) / (k - 1));
      const p = parts[idx];
      if (p) out.set(idx, `${p.d} ${MONTHS[lang][p.m]}`);
    }
    return out;
  }
  const starts: number[] = [];
  parts.forEach((p, i) => {
    const prev = parts[i - 1];
    if (p && (!prev || prev.m !== p.m || prev.y !== p.y)) starts.push(i);
  });
  // a partial first month would sit right next to the following label: drop it when they would touch
  if (starts.length > 2 && starts[1] - starts[0] < n / (max + 1)) starts.shift();
  const step = Math.ceil(starts.length / max);
  starts.filter((_, i) => i % step === 0).forEach((idx) => {
    const p = parts[idx]!;
    out.set(idx, days > 400 ? `${MONTHS[lang][p.m]} ${String(p.y).slice(2)}` : MONTHS[lang][p.m]);
  });
  return out;
}

const WORDS = {
  id: { now: "baru saja", min: (n: number) => `${n} menit lalu`, hour: (n: number) => `${n} jam lalu`, day: (n: number) => `${n} hari lalu` },
  en: {
    now: "just now",
    min: (n: number) => `${n} min ago`,
    hour: (n: number) => `${n} hr ago`,
    day: (n: number) => `${n} d ago`,
  },
};

/** "53 menit lalu". Older than a week falls back to the date. */
export function relativeTime(iso: string, now: Date, lang: Lang): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.floor((now.getTime() - t) / 1000);
  const w = WORDS[lang];
  if (s < 60) return w.now;
  if (s < 3600) return w.min(Math.floor(s / 60));
  if (s < 86400) return w.hour(Math.floor(s / 3600));
  if (s < 7 * 86400) return w.day(Math.floor(s / 86400));
  const d = new Date(t + 7 * 3600_000);
  return `${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const WIB = 7 * 3600_000;
const p2 = (n: number) => String(n).padStart(2, "0");

/** "Hari ini, 09:41 WIB" for today (Jakarta time), otherwise "17 Okt, 09:41 WIB". */
export function formatUpdated(iso: string, now: Date, lang: Lang): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const d = new Date(t + WIB);
  const n = new Date(now.getTime() + WIB);
  const clock = `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} WIB`;
  const same = d.getUTCFullYear() === n.getUTCFullYear() && d.getUTCMonth() === n.getUTCMonth() && d.getUTCDate() === n.getUTCDate();
  if (same) return `${lang === "id" ? "Hari ini" : "Today"}, ${clock}`;
  return `${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()]}, ${clock}`;
}

/** Today's date as YYYY-MM-DD in the Jakarta calendar (used as the max for date inputs). */
export const todayJakarta = (now: Date = new Date()) => new Date(now.getTime() + WIB).toISOString().slice(0, 10);

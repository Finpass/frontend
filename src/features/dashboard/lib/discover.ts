import type { Lang } from "@/features/profile/types";
import type { DiscoverFacets, DiscoverItem, DiscoverSort, SortDir } from "@/features/dashboard/types";
import { pct } from "./format";

export interface DiscoverQuery {
  q: string;
  cls: string;
  exchange: string;
  industry: string;
  sort: DiscoverSort;
  dir: SortDir;
  watchlist: boolean;
}

export const PAGE_SIZE = 50;

export const DEFAULT_QUERY: DiscoverQuery = { q: "", cls: "all", exchange: "", industry: "", sort: "marketCap", dir: "desc", watchlist: false };

/** Query-string params for GET /discover/assets. Empty and default filters are left out. */
export function buildAssetParams(q: DiscoverQuery, cursor?: string | null, limit = PAGE_SIZE): Record<string, string | number> {
  const p: Record<string, string | number> = { sort: q.sort, dir: q.dir, limit };
  const text = q.q.trim();
  if (text) p.q = text;
  if (q.cls && q.cls !== "all") p.class = q.cls;
  if (q.exchange) p.exchange = q.exchange;
  if (q.industry) p.industry = q.industry;
  if (q.watchlist) p.watchlist = "true";
  if (cursor) p.cursor = cursor;
  return p;
}

/** Stable key of everything that changes the result set (cursor excluded). */
export const querySig = (q: DiscoverQuery): string => JSON.stringify(buildAssetParams(q));

/** Clicking a header: same column flips direction, a new column starts descending (names ascending). */
export function nextSort(cur: Pick<DiscoverQuery, "sort" | "dir">, col: DiscoverSort): Pick<DiscoverQuery, "sort" | "dir"> {
  if (cur.sort === col) return { sort: col, dir: cur.dir === "asc" ? "desc" : "asc" };
  return { sort: col, dir: col === "name" ? "asc" : "desc" };
}

export const ariaSort = (cur: Pick<DiscoverQuery, "sort" | "dir">, col: DiscoverSort): "ascending" | "descending" | "none" =>
  cur.sort !== col ? "none" : cur.dir === "asc" ? "ascending" : "descending";

/** Appends a loaded page, dropping rows already shown (keyset pages should not overlap, but never duplicate keys). */
export function mergeItems(prev: DiscoverItem[], next: DiscoverItem[]): DiscoverItem[] {
  const seen = new Set(prev.map((i) => i.symbol));
  return [...prev, ...next.filter((i) => !seen.has(i.symbol))];
}

export function withStar(items: DiscoverItem[], symbol: string, starred: boolean): DiscoverItem[] {
  return items.map((i) => (i.symbol === symbol ? { ...i, starred } : i));
}

const nf = (lang: Lang, min: number, max: number) =>
  new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: true });

const SYMBOL: Record<string, string> = { IDR: "Rp", USD: "$" };

/** "Rp5.175", "$178,45" (ID) / "$178.45" (EN), other currencies as "EUR 12,30". */
export function formatPrice(value: number | null, currency: string, lang: Lang): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const sym = SYMBOL[currency];
  if (currency === "IDR") return `${sign}Rp${nf(lang, 0, abs >= 100 ? 0 : 2).format(abs)}`;
  const body = abs >= 1 ? nf(lang, 2, 2).format(abs) : nf(lang, 2, 6).format(abs);
  return sym ? `${sign}${sym}${body}` : `${sign}${currency} ${body}`;
}

const CAP_UNITS: Record<Lang, [number, string][]> = {
  id: [[1e12, "t"], [1e9, "m"], [1e6, "jt"]],
  en: [[1e12, "T"], [1e9, "B"], [1e6, "M"]],
};

/** ID: "Rp635,7 t" (t, m, jt). EN: "$2.9 T" (T, B, M). */
export function formatMarketCap(value: number | null, currency: string, lang: Lang): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "n/a";
  const sym = SYMBOL[currency] ?? `${currency} `;
  const hit = CAP_UNITS[lang].find(([u]) => value >= u);
  if (!hit) return `${sym}${nf(lang, 0, 0).format(Math.round(value))}`;
  return `${sym}${nf(lang, 1, 1).format(value / hit[0])} ${hit[1]}`;
}

/** Signed percent with the language's decimal separator, 2 digits. */
export const formatReturn = (v: number | null, lang: Lang): string => (v == null ? "n/a" : pct(v, lang, { sign: true, digits: 2 }));

export const formatYield = (v: number | null, lang: Lang): string => (v == null ? "n/a" : pct(v, lang, { digits: 2 }));

export const returnTone = (v: number | null): "gain" | "loss" | "muted" => (v == null || v === 0 ? "muted" : v > 0 ? "gain" : "loss");

const VAL_LABEL = { PE: "P/E", PB: "P/B", PS: "P/S" } as const;

export function formatValuation(v: DiscoverItem["valuation"], lang: Lang): { chip: string; text: string } | null {
  if (!v) return null;
  return { chip: VAL_LABEL[v.metric], text: `${v.value < 0 ? "-" : ""}${nf(lang, 1, 1).format(Math.abs(v.value))}x` };
}

export function formatGrowth(g: DiscoverItem["growth"], lang: Lang): { chip: string; text: string; tone: "gain" | "loss" | "muted" } | null {
  if (!g) return null;
  return { chip: g.metric, text: pct(g.pct, lang, { sign: true, digits: 1 }), tone: returnTone(g.pct) };
}

export interface Opt {
  value: string;
  label: string;
}

/** Tab options: "all" first, then the classes the backend reports (labels by language). */
export function classOptions(f: DiscoverFacets | null, lang: Lang, allLabel: string): Opt[] {
  return [{ value: "all", label: allLabel }, ...(f?.classes ?? []).map((c) => ({ value: c.value, label: (lang === "id" ? c.labelId : c.labelEn) || c.value }))];
}

export const countOptions = (rows: { value: string; count: number }[] | undefined): Opt[] =>
  (rows ?? []).map((r) => ({ value: r.value, label: `${r.value} (${r.count})` }));

/** Class label of a row in the active language, falling back to the other one or the raw code. */
export const itemClassLabel = (i: Pick<DiscoverItem, "assetClass" | "assetClassLabelId" | "assetClassLabelEn">, lang: Lang): string =>
  (lang === "id" ? i.assetClassLabelId : i.assetClassLabelEn) || i.assetClassLabelEn || i.assetClassLabelId || i.assetClass;

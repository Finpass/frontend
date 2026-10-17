import { colors } from "@/design-system/colors";
import type { Holding } from "@/features/dashboard/types";

export const CLASS_COLORS = [colors.blue, colors.cyan, colors.warn, colors.teal, colors.violet, colors.accent];

export interface AllocationRow {
  key: string;
  label: string;
  pct: number;
}

/** Share of market value per asset class, largest first. Falls back to cost basis when nothing has a market value. */
export function allocationByClass(items: Holding[]): AllocationRow[] {
  const useCost = items.every((h) => !h.marketValue);
  const total = items.reduce((s, h) => s + (useCost ? h.costBasis : h.marketValue), 0);
  if (total <= 0) return [];
  const by = new Map<string, AllocationRow & { v: number }>();
  for (const h of items) {
    const v = useCost ? h.costBasis : h.marketValue;
    const row = by.get(h.assetClass) ?? { key: h.assetClass, label: h.assetClassLabelId, pct: 0, v: 0 };
    row.v += v;
    by.set(h.assetClass, row);
  }
  return [...by.values()]
    .map(({ key, label, v }) => ({ key, label, pct: (v / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);
}

export function filterHoldings<T extends Holding>(items: T[], query: string, assetClass: string): T[] {
  const q = query.trim().toLowerCase();
  return items.filter(
    (h) =>
      (assetClass === "all" || h.assetClass === assetClass) &&
      (!q || [h.symbol ?? "", h.name, h.subtitle, h.assetClassLabelId].some((s) => s.toLowerCase().includes(q))),
  );
}

export function classOptions(items: Holding[]): { key: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const h of items) if (!seen.has(h.assetClass)) seen.set(h.assetClass, h.assetClassLabelId);
  return [...seen].map(([key, label]) => ({ key, label }));
}

export function initials(h: Pick<Holding, "symbol" | "name">): string {
  if (h.symbol) return h.symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  const words = h.name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Stable colour per asset class code, so the same class keeps its colour as filters change. */
export function classColor(code: string, known: string[]): string {
  const i = known.indexOf(code);
  return CLASS_COLORS[(i < 0 ? 0 : i) % CLASS_COLORS.length];
}


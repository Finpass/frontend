import { colors } from "@/design-system/colors";
import type { Lang } from "@/features/profile/types";
import type { BiText, ProductClass, ProductsResult } from "@/features/dashboard/types";

export const text = (t: BiText, lang: Lang) => (lang === "id" ? t.id : t.en);

/** Classes that actually carry weight, in the order the backend returned them. */
export function allocationBar(portfolio: ProductClass[]): { key: string; pct: number }[] {
  return portfolio.filter((c) => c.allocation > 0).map((c) => ({ key: c.class, pct: c.allocation }));
}

/** One line for the "how it was computed" panel: pool size, shortlist, gate exclusions. */
export function funnelStats(trace: ProductsResult["trace"]) {
  const eligible = trace.shortlist.reduce((s, x) => s + x.eligible, 0);
  const kept = trace.shortlist.reduce((s, x) => s + x.kept, 0);
  const excluded = trace.gatesApplied.reduce((s, x) => s + x.excluded, 0);
  return { excluded, eligible, kept };
}

// one color per class (up to 11), so no two legend dots look alike
const HUES = [colors.blue, colors.cyan, colors.teal, colors.gain, colors.warn, "#fb923c", colors.loss, "#f472b6", colors.violet, colors.accent, "#94a3b8"];
export const classHue = (key: string, keys: string[]) => HUES[Math.max(keys.indexOf(key), 0) % HUES.length];

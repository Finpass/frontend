import { describe, expect, it } from "vitest";
import type { DiscoverItem } from "@/features/dashboard/types";
import {
  DEFAULT_QUERY,
  ariaSort,
  buildAssetParams,
  classOptions,
  countOptions,
  formatGrowth,
  formatMarketCap,
  formatPrice,
  formatReturn,
  formatValuation,
  formatYield,
  mergeItems,
  nextSort,
  querySig,
  returnTone,
  withStar,
} from "./discover";

const item = (symbol: string, starred = false): DiscoverItem => ({
  symbol, name: symbol, assetClass: "equity", assetClassLabelId: "Saham", assetClassLabelEn: "Stock", exchange: "JKT", currency: "IDR",
  lastPrice: 1, lastTradeDate: null, ret7d: null, ret1y: null, marketCap: null, analystTarget: null, valuation: null, growth: null, divYieldPct: null, industry: null, starred,
});

describe("buildAssetParams", () => {
  it("omits defaults and empties", () => {
    expect(buildAssetParams(DEFAULT_QUERY)).toEqual({ sort: "marketCap", dir: "desc", limit: 50 });
  });
  it("includes active filters and the cursor", () => {
    const p = buildAssetParams({ ...DEFAULT_QUERY, q: " bca ", cls: "equity", exchange: "JKT", industry: "Banks", watchlist: true }, "abc", 20);
    expect(p).toEqual({ sort: "marketCap", dir: "desc", limit: 20, q: "bca", class: "equity", exchange: "JKT", industry: "Banks", watchlist: "true", cursor: "abc" });
  });
  it("signature ignores nothing that changes results", () => {
    expect(querySig(DEFAULT_QUERY)).toBe(querySig({ ...DEFAULT_QUERY }));
    expect(querySig(DEFAULT_QUERY)).not.toBe(querySig({ ...DEFAULT_QUERY, dir: "asc" }));
  });
});

describe("sorting", () => {
  it("flips direction on the same column", () => {
    expect(nextSort({ sort: "ret1y", dir: "desc" }, "ret1y")).toEqual({ sort: "ret1y", dir: "asc" });
    expect(nextSort({ sort: "ret1y", dir: "asc" }, "ret1y")).toEqual({ sort: "ret1y", dir: "desc" });
  });
  it("starts new columns descending, names ascending", () => {
    expect(nextSort({ sort: "ret1y", dir: "asc" }, "lastPrice")).toEqual({ sort: "lastPrice", dir: "desc" });
    expect(nextSort({ sort: "ret1y", dir: "desc" }, "name")).toEqual({ sort: "name", dir: "asc" });
  });
  it("reports aria-sort", () => {
    expect(ariaSort({ sort: "name", dir: "asc" }, "name")).toBe("ascending");
    expect(ariaSort({ sort: "name", dir: "desc" }, "name")).toBe("descending");
    expect(ariaSort({ sort: "name", dir: "desc" }, "ret7d")).toBe("none");
  });
});

describe("lists", () => {
  it("merges pages without duplicates", () => {
    expect(mergeItems([item("A"), item("B")], [item("B"), item("C")]).map((i) => i.symbol)).toEqual(["A", "B", "C"]);
  });
  it("sets the star on one row only", () => {
    const r = withStar([item("A"), item("B")], "B", true);
    expect(r.map((i) => i.starred)).toEqual([false, true]);
  });
});

describe("formatPrice", () => {
  it("formats IDR whole", () => expect(formatPrice(5175, "IDR", "id")).toBe("Rp5.175"));
  it("formats USD per language", () => {
    expect(formatPrice(178.45, "USD", "id")).toBe("$178,45");
    expect(formatPrice(178.45, "USD", "en")).toBe("$178.45");
  });
  it("uses the code for other currencies", () => expect(formatPrice(12.3, "EUR", "en")).toBe("EUR 12.30"));
  it("keeps small crypto prices readable", () => expect(formatPrice(0.00001234, "USD", "en")).toBe("$0.000012"));
  it("shows n/a for null", () => expect(formatPrice(null, "USD", "en")).toBe("n/a"));
});

describe("formatMarketCap", () => {
  it("uses Indonesian units in ID", () => {
    expect(formatMarketCap(635_700_000_000_000, "IDR", "id")).toBe("Rp635,7 t");
    expect(formatMarketCap(12_500_000_000, "IDR", "id")).toBe("Rp12,5 m");
    expect(formatMarketCap(4_000_000, "IDR", "id")).toBe("Rp4,0 jt");
  });
  it("uses T/B/M in EN", () => {
    expect(formatMarketCap(2_900_000_000_000, "USD", "en")).toBe("$2.9 T");
    expect(formatMarketCap(3_400_000_000, "USD", "en")).toBe("$3.4 B");
  });
  it("is n/a when missing or not positive", () => {
    expect(formatMarketCap(null, "IDR", "id")).toBe("n/a");
    expect(formatMarketCap(0, "IDR", "id")).toBe("n/a");
  });
});

describe("percent and chips", () => {
  it("signs returns with the language separator", () => {
    expect(formatReturn(12.345, "id")).toBe("+12,35%");
    expect(formatReturn(-3.5, "en")).toBe("-3.50%");
    expect(formatReturn(null, "en")).toBe("n/a");
  });
  it("tones returns", () => {
    expect(returnTone(1)).toBe("gain");
    expect(returnTone(-1)).toBe("loss");
    expect(returnTone(0)).toBe("muted");
    expect(returnTone(null)).toBe("muted");
  });
  it("formats yield without sign", () => expect(formatYield(6.27, "id")).toBe("6,27%"));
  it("formats valuation chips", () => {
    expect(formatValuation({ metric: "PE", value: 14.26 }, "id")).toEqual({ chip: "P/E", text: "14,3x" });
    expect(formatValuation(null, "id")).toBeNull();
  });
  it("formats growth chips", () => {
    expect(formatGrowth({ metric: "E", pct: -4.2 }, "en")).toEqual({ chip: "E", text: "-4.2%", tone: "loss" });
    expect(formatGrowth(null, "en")).toBeNull();
  });
});

describe("facets", () => {
  const f = { classes: [{ value: "equity", labelId: "Saham", labelEn: "Stocks", count: 5 }], exchanges: [{ value: "JKT", count: 3 }], industries: [] };
  it("puts all first and localises labels", () => {
    expect(classOptions(f, "id", "Semua")).toEqual([{ value: "all", label: "Semua" }, { value: "equity", label: "Saham" }]);
    expect(classOptions(f, "en", "All")[1].label).toBe("Stocks");
    expect(classOptions(null, "en", "All")).toEqual([{ value: "all", label: "All" }]);
  });
  it("maps counts", () => expect(countOptions(f.exchanges)).toEqual([{ value: "JKT", label: "JKT (3)" }]));
});

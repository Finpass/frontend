import { describe, expect, it } from "vitest";
import type { Holding } from "@/features/dashboard/types";
import { allocationByClass, classOptions, filterHoldings, initials } from "./holdings";
import { guardDecision } from "./guard";
import { validateHolding, type FormInput } from "./holding-form";

const h = (o: Partial<Holding>): Holding => ({
  id: "1", symbol: "BBCA", name: "Bank Central Asia", subtitle: "Bluechip", assetClass: "equity", assetClassLabelId: "Saham",
  currency: "IDR", units: 1, avgCost: 1, lastPrice: 1, lastPriceDate: "2026-10-16", marketValue: 100, costBasis: 80,
  change1dPct: 0, totalReturnPct: 0, totalReturnIDR: 0, weightPct: 0, trend1y: [], isManual: false, acquiredAt: "2026-01-01", dividendsIDR: 0, ...o,
});

describe("holdings helpers", () => {
  const items = [h({}), h({ id: "2", symbol: null, name: "Sucorinvest Money Market", assetClass: "mutual_fund", assetClassLabelId: "Reksa Dana", marketValue: 300 })];
  it("allocates by class, largest first, summing to 100", () => {
    const a = allocationByClass(items);
    expect(a.map((r) => r.key)).toEqual(["mutual_fund", "equity"]);
    expect(a.reduce((s, r) => s + r.pct, 0)).toBeCloseTo(100);
    expect(a[0].pct).toBeCloseTo(75);
  });
  it("falls back to cost and handles empty", () => {
    expect(allocationByClass([])).toEqual([]);
    expect(allocationByClass([h({ marketValue: 0, costBasis: 50 })])[0].pct).toBe(100);
    expect(allocationByClass([h({ marketValue: 0, costBasis: 0 })])).toEqual([]);
  });
  it("filters by text and class", () => {
    expect(filterHoldings(items, "money", "all")).toHaveLength(1);
    expect(filterHoldings(items, "", "equity")).toHaveLength(1);
    expect(filterHoldings(items, "bbca", "mutual_fund")).toHaveLength(0);
    expect(classOptions(items)).toEqual([{ key: "equity", label: "Saham" }, { key: "mutual_fund", label: "Reksa Dana" }]);
  });
  it("initials", () => {
    expect(initials({ symbol: "BBCA", name: "x" })).toBe("BBC");
    expect(initials({ symbol: null, name: "Emas Antam" })).toBe("EA");
    expect(initials({ symbol: null, name: "Emas" })).toBe("EM");
  });
});

describe("holding form", () => {
  const base: FormInput = { mode: "search", symbol: "BBCA", name: "", assetClass: "", currentPrice: "", units: "100", avgCost: "9.150", acquiredAt: "2026-01-02", };
  it("accepts a valid catalog holding", () => {
    expect(validateHolding(base, "2026-10-17")).toEqual({ ok: true, create: { symbol: "BBCA", units: 100, avgCost: 9150, acquiredAt: "2026-01-02" } });
  });
  it("requires an instrument and positive numbers", () => {
    const r = validateHolding({ ...base, symbol: "", units: "0", avgCost: "-1", acquiredAt: "" }, "2026-10-17");
    expect(r).toEqual({ ok: false, errors: { instrument: "required", units: "positive", avgCost: "invalid", acquiredAt: "required" } });
  });
  it("rejects a future date but allows today", () => {
    expect(validateHolding({ ...base, acquiredAt: "2026-10-18" }, "2026-10-17")).toMatchObject({ ok: false, errors: { acquiredAt: "future" } });
    expect(validateHolding({ ...base, acquiredAt: "2026-10-17" }, "2026-10-17").ok).toBe(true);
  });
  it("validates manual instruments", () => {
    const m: FormInput = { ...base, mode: "manual", symbol: "", name: " SR021 ", assetClass: "bond_sbn", currentPrice: "100jt" };
    expect(validateHolding(m, "2026-10-17")).toMatchObject({ ok: true, create: { manual: { name: "SR021", assetClass: "bond_sbn", currency: "IDR", currentPrice: 100_000_000 } } });
    expect(validateHolding({ ...m, name: "", assetClass: "x", currentPrice: "" }, "2026-10-17")).toMatchObject({ ok: false, errors: { name: "required", assetClass: "required", currentPrice: "required" } });
  });
  it("edit sends the price only for manual holdings", () => {
    const e: FormInput = { ...base, mode: "edit", symbol: "", currentPrice: "1450" };
    expect(validateHolding(e, "2026-10-17")).toEqual({ ok: true, update: { units: 100, avgCost: 9150, acquiredAt: "2026-01-02" } });
    expect(validateHolding({ ...e, isManual: true }, "2026-10-17")).toMatchObject({ ok: true, update: { currentPrice: 1450 } });
  });
});

describe("guard", () => {
  it("decides", () => {
    expect(guardDecision("loading", "loading")).toBe("loading");
    expect(guardDecision("guest", "loading")).toBe("signin");
    expect(guardDecision("authed", "loading")).toBe("loading");
    expect(guardDecision("authed", "none")).toBe("onboarding");
    expect(guardDecision("authed", "draft")).toBe("onboarding");
    expect(guardDecision("authed", "error")).toBe("error");
    expect(guardDecision("authed", "completed")).toBe("ok");
  });
});

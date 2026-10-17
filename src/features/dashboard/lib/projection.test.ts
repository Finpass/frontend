import { describe, expect, it } from "vitest";
import type { ProductClass } from "@/features/dashboard/types";
import { amountFor, portfolioStats, project } from "./projection";

const cls = (c: string, a: number): ProductClass => ({ class: c, label: { id: c, en: c }, allocation: a, currentPct: 0, unallocated: 0, assets: [] });

describe("projection", () => {
  it("weights the class assumptions", () => {
    const s = portfolioStats([cls("deposits", 50), cls("equity_large_cap", 50)]);
    expect(s.mu).toBeCloseTo(7.25, 5);
    expect(s.sigma).toBeGreaterThan(5);
    expect(s.sigma).toBeLessThan(20);
  });
  it("is zero for an empty portfolio and tolerates unknown classes", () => {
    expect(portfolioStats([])).toEqual({ mu: 0, sigma: 0 });
    expect(portfolioStats([cls("mystery", 100)]).mu).toBe(5);
  });
  it("compounds the base path and widens the band over time", () => {
    const pts = project(100_000_000, { mu: 10, sigma: 20 }, 5);
    expect(pts).toHaveLength(61);
    expect(pts[0]).toEqual({ month: 0, base: 100_000_000, low: 100_000_000, high: 100_000_000 });
    expect(pts[12].base).toBeCloseTo(110_000_000, 0);
    expect(pts[60].low).toBeLessThan(pts[60].base);
    expect(pts[60].high).toBeGreaterThan(pts[60].base);
    expect(pts[60].high - pts[60].low).toBeGreaterThan(pts[12].high - pts[12].low);
  });
  it("splits capital by weight", () => {
    expect(amountFor(100_000_000, 12.5)).toBe(12_500_000);
  });
});

import { describe, expect, it } from "vitest";
import type { ProductClass, ProductsResult } from "@/features/dashboard/types";
import { allocationBar, funnelStats, text } from "./matching";

const cls = (c: string, a: number): ProductClass => ({ class: c, label: { id: c, en: c }, allocation: a, currentPct: 0, unallocated: 0, assets: [] });

describe("matching helpers", () => {
  it("drops zero-weight classes from the bar", () => {
    expect(allocationBar([cls("a", 60), cls("b", 0), cls("c", 40)])).toEqual([{ key: "a", pct: 60 }, { key: "c", pct: 40 }]);
  });
  it("sums the funnel", () => {
    const trace = {
      shortlist: [{ class: "a", eligible: 40, kept: 20 }, { class: "b", eligible: 5, kept: 5 }],
      gatesApplied: [{ gate: "sharia", excluded: 7 }, { gate: "horizon", excluded: 3 }],
    } as unknown as ProductsResult["trace"];
    expect(funnelStats(trace)).toEqual({ excluded: 10, eligible: 45, kept: 25 });
  });
  it("picks the language", () => {
    expect(text({ id: "a", en: "b" }, "en")).toBe("b");
  });
});

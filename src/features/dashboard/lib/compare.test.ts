import { describe, expect, it } from "vitest";
import { askQuestion, leaderIndex, niceRange, num, parseSymbols, radarPoint, recordSummary, toggleSymbol } from "./compare";

describe("compare helpers", () => {
  it("parses, upper-cases, dedupes and caps the symbol list", () => {
    expect(parseSymbols("bbca.jk, BBRI.JK,,bbca.jk")).toEqual(["BBCA.JK", "BBRI.JK"]);
    expect(parseSymbols("a,b,c,d,e")).toEqual(["A", "B", "C", "D"]);
    expect(parseSymbols(null)).toEqual([]);
  });
  it("toggles a symbol and refuses a fifth", () => {
    expect(toggleSymbol(["A"], "b")).toEqual(["A", "B"]);
    expect(toggleSymbol(["A", "B"], "a")).toEqual(["B"]);
    expect(toggleSymbol(["A", "B", "C", "D"], "e")).toEqual(["A", "B", "C", "D"]);
  });
  it("names a leader only when values differ", () => {
    expect(leaderIndex([1, 3, 2], true)).toBe(1);
    expect(leaderIndex([4, 2, 9], false)).toBe(1);
    expect(leaderIndex([5, 5], true)).toBe(-1);
    expect(leaderIndex([null, 3], true)).toBe(-1);
    expect(leaderIndex([null, 3, 1], true)).toBe(1);
  });
  it("formats missing numbers as a dash", () => {
    expect(num(null)).toBe("-");
    expect(num(12.345, 1, "%")).toBe("12.3%");
  });
  it("builds a question and a record summary in both languages", () => {
    expect(askQuestion(["A", "B"], "en")).toContain("A, B");
    expect(askQuestion(["A", "B"], "id")).toContain("profil dan portofolio saya");
    const rec = { id: 1, kind: "comparison" as const, createdAt: "", payload: { assets: [{ symbol: "A" }, { symbol: "B" }], best: "B" } };
    expect(recordSummary(rec, "en")).toBe("A vs B. Best fit: B");
    expect(recordSummary({ ...rec, kind: "portfolio", payload: { target: { gold: 5, etf: 30 } } }, "id")).toContain("etf 30%");
  });
  it("places radar points on the axes", () => {
    const [x0, y0] = radarPoint(0, 4, 100, 50, 100, 100);
    expect([Math.round(x0), Math.round(y0)]).toEqual([100, 50]); // axis 0 points up
    const [x1, y1] = radarPoint(1, 4, 50, 50, 100, 100);
    expect([Math.round(x1), Math.round(y1)]).toEqual([125, 100]); // axis 1 points right, half way
    expect(radarPoint(0, 4, 250, 50, 0, 0)[1]).toBeCloseTo(-50); // clamped to 100
  });
  it("builds round axis bounds that contain the data", () => {
    const r = niceRange(-28.4, 12.3);
    expect(r.lo).toBeLessThanOrEqual(-28.4);
    expect(r.hi).toBeGreaterThanOrEqual(12.3);
    expect(r.step).toBe(20);
    expect(niceRange(5, 5).hi).toBeGreaterThan(5);
  });
});

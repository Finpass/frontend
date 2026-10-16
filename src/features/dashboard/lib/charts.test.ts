import { describe, expect, it } from "vitest";
import { areaPath, downsample, evenX, labelIndexes, linePath, nearestIndex, niceTicks, paddedDomain, percentChange, scale, smoothPath } from "./charts";

describe("charts", () => {
  it("nice ticks", () => {
    expect(niceTicks(123_456_789)).toEqual([0, 50e6, 100e6, 150e6]);
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
  });
  it("scale and domain", () => {
    const y = scale(0, 100, 200, 0);
    expect(y(0)).toBe(200);
    expect(y(100)).toBe(0);
    expect(scale(5, 5, 0, 10)(5)).toBe(5);
    expect(paddedDomain([10, 20])).toEqual([9, 21]);
    const [lo, hi] = paddedDomain([5, 5]);
    expect(lo).toBeLessThan(5);
    expect(hi).toBeGreaterThan(5);
    expect(paddedDomain([])).toEqual([0, 1]);
  });
  it("paths", () => {
    expect(linePath([[0, 1], [2, 3]])).toBe("M0 1 L2 3");
    expect(areaPath("M0 1 L2 3", [0, 1], [2, 3], 10)).toBe("M0 1 L2 3 L2 10 L0 10 Z");
    expect(smoothPath([[0, 0], [1, 1]])).toBe("M0 0 L1 1");
    const d = smoothPath([[0, 0], [1, 5], [2, 5], [3, 10]]);
    expect(d.startsWith("M0 0 C")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(3);
    // monotone: no control point leaves the data's y range
    const ys = (d.match(/-?\d+(\.\d+)? -?\d+(\.\d+)?/g) ?? []).map((p) => Number(p.split(" ")[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(10);
  });
  it("sampling and hover", () => {
    expect(evenX(3, 0, 10)).toEqual([0, 5, 10]);
    expect(evenX(1, 0, 10)).toEqual([5]);
    expect(downsample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4)).toEqual([1, 4, 7, 10]);
    expect(downsample([1, 2], 5)).toEqual([1, 2]);
    expect([...labelIndexes(10, 3)]).toEqual([0, 5, 9]);
    expect(labelIndexes(2, 5).size).toBe(2);
    expect(nearestIndex(4, 3, 0, 10)).toBe(1);
    expect(nearestIndex(-5, 3, 0, 10)).toBe(0);
    expect(nearestIndex(99, 3, 0, 10)).toBe(2);
    expect(nearestIndex(5, 1, 0, 10)).toBe(0);
  });
  it("percent change", () => {
    expect(percentChange(100, 125)).toBe(25);
    expect(percentChange(0, 5)).toBe(0);
  });
});

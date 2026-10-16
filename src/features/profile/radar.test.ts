import { describe, expect, it } from "vitest";
import { axisPoint, bandOf, polygonPoints } from "./radar";

describe("radar", () => {
  it("colors by threshold", () => {
    expect([0, 40, 40.4].map(bandOf)).toEqual(["red", "red", "red"]);
    expect([41, 70, 70.4].map(bandOf)).toEqual(["yellow", "yellow", "yellow"]);
    expect([71, 100].map(bandOf)).toEqual(["green", "green"]);
  });
  it("puts the first axis straight up and goes clockwise", () => {
    expect(axisPoint(0, 5, 100, 100, 100, 50)).toEqual({ x: 100, y: 50 });
    expect(axisPoint(0, 5, 0, 100, 100, 50)).toEqual({ x: 100, y: 100 });
    const right = axisPoint(1, 5, 100, 100, 100, 50);
    expect(right.x).toBeGreaterThan(100);
    expect(right.y).toBeLessThan(100);
  });
  it("clamps values and yields one point per axis", () => {
    const pts = polygonPoints([150, -10, 50, 50, 50], 0, 0, 10);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual({ x: 0, y: -10 });
    expect(pts[1]).toEqual({ x: 0, y: 0 });
  });
});

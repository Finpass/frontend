import { describe, expect, it } from "vitest";
import { compactIdr, decimal, formatUpdated, idr, monthLabel, parseDecimal, pct, relativeTime, shortDate, signedIdr, todayJakarta, axisLabels } from "./format";

describe("money", () => {
  it("formats rupiah", () => {
    expect(idr(120000000)).toBe("Rp 120.000.000");
    expect(idr(-1500)).toBe("-Rp 1.500");
    expect(idr(0)).toBe("Rp 0");
    expect(idr(999.6)).toBe("Rp 1.000");
    expect(signedIdr(2225000)).toBe("+Rp 2.225.000");
    expect(signedIdr(-5)).toBe("-Rp 5");
  });
  it("formats compact", () => {
    expect(compactIdr(150_000_000, "id")).toBe("Rp 150 jt");
    expect(compactIdr(1_500_000_000, "id")).toBe("Rp 1,5 M");
    expect(compactIdr(0, "id")).toBe("Rp 0");
    expect(compactIdr(500, "id")).toBe("Rp 500");
    expect(compactIdr(2_500_000, "en")).toBe("Rp 2.5 M");
    expect(compactIdr(-50_000, "id")).toBe("-Rp 50 rb");
  });
  it("formats percent with locale decimal", () => {
    expect(pct(12.5, "id", { sign: true })).toBe("+12,5%");
    expect(pct(-0.04, "id", { digits: 2, sign: true })).toBe("-0,04%");
    expect(pct(27.04, "id", { digits: 2 })).toBe("27,04%");
    expect(pct(12.5, "en")).toBe("12.5%");
    expect(pct(0, "id", { sign: true })).toBe("+0,0%");
    expect(pct(-0.001, "id")).toBe("0,0%");
  });
  it("groups the integer part of decimals", () => {
    expect(decimal(1234.5, 1, "id")).toBe("1.234,5");
  });
});

describe("parseDecimal", () => {
  it.each([
    ["10", 10],
    ["10,5", 10.5],
    ["10.5", 10.5],
    ["1.234,56", 1234.56],
    ["1.000", 1000],
    [" 2 ", 2],
  ])("%s", (raw, v) => expect(parseDecimal(raw)).toBe(v));
  it("rejects garbage", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("-3")).toBeNull();
    expect(parseDecimal("1,2,3")).toBeNull();
  });
});

describe("time", () => {
  const now = new Date("2026-10-17T10:00:00Z");
  it("relative time", () => {
    expect(relativeTime("2026-10-17T09:59:30Z", now, "id")).toBe("baru saja");
    expect(relativeTime("2026-10-17T09:07:00Z", now, "id")).toBe("53 menit lalu");
    expect(relativeTime("2026-10-17T05:00:00Z", now, "id")).toBe("5 jam lalu");
    expect(relativeTime("2026-10-15T10:00:00Z", now, "id")).toBe("2 hari lalu");
    expect(relativeTime("2026-10-15T10:00:00Z", now, "en")).toBe("2 d ago");
    expect(relativeTime("2026-09-01T10:00:00Z", now, "id")).toBe("1 Sep 2026");
    expect(relativeTime("2026-10-17T11:00:00Z", now, "id")).toBe("baru saja");
    expect(relativeTime("nope", now, "id")).toBe("");
  });
  it("last updated in Jakarta time", () => {
    expect(formatUpdated("2026-10-17T02:41:00Z", now, "id")).toBe("Hari ini, 09:41 WIB");
    expect(formatUpdated("2026-10-17T02:41:00Z", now, "en")).toBe("Today, 09:41 WIB");
    expect(formatUpdated("2026-10-15T20:00:00Z", now, "id")).toBe("16 Okt, 03:00 WIB");
  });
  it("labels", () => {
    expect(monthLabel("2026-05-31", "id")).toBe("Mei");
    expect(monthLabel("2026-05-31", "en")).toBe("May");
    expect(shortDate("2026-10-17", "id")).toBe("17 Okt 2026");
    expect(todayJakarta(new Date("2026-10-17T20:00:00Z"))).toBe("2026-10-18");
  });
});

describe("axisLabels", () => {
  const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(from) + i * 86_400_000).toISOString().slice(0, 10));
  it("labels the first day of each month on a six month daily series", () => {
    const d = days("2026-04-17", 183);
    const labels = [...axisLabels(d, "en", 7)].map(([, l]) => l);
    expect(labels).toEqual(["May", "Jun", "Jul", "Aug", "Sep", "Oct"]); // Apr starts 14 days in: too close to May, dropped
    expect([...axisLabels(d, "en", 5).values()]).toEqual(["May", "Jul", "Sep"]); // thinned evenly when over the limit
  });
  it("uses day and month on a short range, evenly spaced", () => {
    const labels = axisLabels(days("2026-10-01", 30), "id", 6);
    expect([...labels.values()]).toEqual(["1 Okt", "11 Okt", "20 Okt", "30 Okt"]);
  });
  it("thins to the maximum and adds the year across years", () => {
    const labels = axisLabels(days("2024-01-01", 800), "en", 6);
    expect(labels.size).toBeLessThanOrEqual(6);
    expect([...labels.values()][0]).toBe("Feb 24");
  });
  it("handles empty and single point series", () => {
    expect(axisLabels([], "en").size).toBe(0);
    expect([...axisLabels(["2026-10-17"], "en").values()]).toEqual(["17 Oct"]);
  });
});

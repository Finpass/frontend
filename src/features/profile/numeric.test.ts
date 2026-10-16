import { describe, expect, it } from "vitest";
import { formatIdr, parseIdr } from "./numeric";

describe("parseIdr", () => {
  it.each([
    ["15jt", 15_000_000],
    ["15 juta", 15_000_000],
    ["1,5jt", 1_500_000],
    ["15.000.000", 15_000_000],
    ["15000000", 15_000_000],
    ["Rp 15.000.000", 15_000_000],
    ["500rb", 500_000],
    ["0", 0],
  ])("parses %s", (raw, n) => expect(parseIdr(raw)).toBe(n));

  it.each(["", "abc", "15x", "1.5", "12.34.5", "-5", "jt"])("rejects %j", (raw) => expect(parseIdr(raw)).toBeNull());

  it("formats with Rp and dots", () => expect(formatIdr(15_000_000)).toBe("Rp 15.000.000"));
});

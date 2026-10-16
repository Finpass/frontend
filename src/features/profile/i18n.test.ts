import { describe, expect, it } from "vitest";
import { DICT, fmt, keyPaths, normalizeLang } from "./i18n";

describe("i18n", () => {
  it("has identical keys in ID and EN", () => {
    expect(keyPaths(DICT.id).sort()).toEqual(keyPaths(DICT.en).sort());
  });
  it("keeps placeholders identical across languages", () => {
    const ph = (o: unknown) => JSON.stringify(o).match(/\{\w+\}/g)?.sort();
    expect(ph(DICT.id)).toEqual(ph(DICT.en));
  });
  it("has no em dashes", () => expect(JSON.stringify(DICT)).not.toContain("—"));
  it("interpolates and defaults to id", () => {
    expect(fmt("a {x} b", { x: 1 })).toBe("a 1 b");
    expect(normalizeLang(null)).toBe("id");
    expect(normalizeLang("en")).toBe("en");
  });
});

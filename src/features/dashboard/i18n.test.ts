import { describe, expect, it } from "vitest";
import { keyPaths } from "@/features/profile/i18n";
import { DASH } from "./i18n";

describe("dashboard i18n", () => {
  it("has identical keys in ID and EN", () => {
    expect(keyPaths(DASH.id).sort()).toEqual(keyPaths(DASH.en).sort());
  });
  it("keeps placeholders identical", () => {
    const ph = (o: unknown) => JSON.stringify(o).match(/\{\w+\}/g)?.sort();
    expect(ph(DASH.id)).toEqual(ph(DASH.en));
  });
  it("has no em dashes", () => expect(JSON.stringify(DASH)).not.toContain("—"));
});

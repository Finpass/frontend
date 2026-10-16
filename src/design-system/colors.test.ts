import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colors } from "./colors";

describe("design tokens", () => {
  it("keeps colors.ts in sync with tokens.css", () => {
    const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
    for (const [name, hex] of Object.entries(colors)) {
      expect(css).toContain(`--color-${name}: ${hex};`);
    }
  });
});

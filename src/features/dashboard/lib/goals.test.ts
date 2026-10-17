import { describe, expect, it } from "vitest";
import { goalLabel, horizonLabel, humanize } from "./goals";

describe("goal and horizon labels", () => {
  it("maps ids to the language of the UI", () => {
    expect(goalLabel("wealth_growth", "en")).toBe("Wealth growth");
    expect(goalLabel("wealth_growth", "id")).toBe("Pertumbuhan kekayaan");
    expect(horizonLabel("3_5", "en")).toBe("3–5 years");
    expect(horizonLabel("gt_10", "id")).toBe("> 10 tahun");
  });
  it("falls back to readable text for an unknown id", () => {
    expect(goalLabel("early_retirement", "en")).toBe("Early Retirement");
    expect(humanize("a_b")).toBe("A B");
  });
});

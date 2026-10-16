import { describe, expect, it } from "vitest";
import { firstIncomplete, resumeIndex } from "./progress";
import type { Question, Section } from "./types";
import { toggleMulti, validateInvestAmount, validateQuestion, validateSection } from "./validation";

const q = (o: Partial<Question> & { id: string }): Question => ({ type: "numeric", required: true, textEn: "", textId: "", ...o });
const opts = ["a", "b", "none"].map((id) => ({ id, labelEn: id, labelId: id }));
const s2: Section = {
  id: "section_2", nameEn: "", nameId: "", icon: "",
  questions: [
    q({ id: "q2", min: 0, max: 1_000_000_000, optOutAllowed: true }),
    q({ id: "q6", type: "multi_select", options: opts, exclusiveOption: "none", followup: { id: "q6_installment", textEn: "", textId: "", unit: "", min: 0, max: 1_000_000_000, showWhen: { qid: "q6", notIn: ["none"] } } }),
  ],
};
const s1: Section = { id: "section_1", nameEn: "", nameId: "", icon: "", questions: [q({ id: "q1", type: "single_choice", options: opts })] };

describe("validateQuestion", () => {
  it("requires, ranges and honours opt-out", () => {
    expect(validateQuestion(s2.questions[0], undefined)).toEqual({ code: "required" });
    expect(validateQuestion(s2.questions[0], 2_000_000_000)?.code).toBe("range");
    expect(validateQuestion(s2.questions[0], undefined, ["q2"])).toBeNull();
    expect(validateQuestion(q({ id: "q16b", type: "single_choice", required: false, options: opts }), undefined)).toBeNull();
  });
  it("rejects unknown single choice", () => expect(validateQuestion(s1.questions[0], "zzz")?.code).toBe("choice"));
  it("keeps the exclusive option alone", () => {
    expect(toggleMulti(["a"], "none", "none")).toEqual(["none"]);
    expect(toggleMulti(["none"], "b", "none")).toEqual(["b"]);
    expect(toggleMulti(["a", "b"], "a", "none")).toEqual(["b"]);
    expect(validateQuestion(s2.questions[1], ["a", "none"])?.code).toBe("exclusive");
  });
});

describe("section validation", () => {
  it("requires the installment followup only when q6 is not none", () => {
    expect(validateSection(s2, { q2: 1, q6: ["a"] }, [])["q6_installment"]).toEqual({ code: "required" });
    expect(validateSection(s2, { q2: 1, q6: ["none"] }, [])).toEqual({});
    expect(validateSection(s2, { q6: ["none"] }, ["q2"])).toEqual({});
  });
  it("checks q8 against surplus", () => {
    expect(validateInvestAmount({ q2: 10_000_000, q3: 6_000_000, q6: ["a"], q6_installment: 1_000_000, q8: 3_000_001 }, [])).toEqual({ code: "q8_exceeds", surplus: 3_000_000 });
    expect(validateInvestAmount({ q2: 10_000_000, q3: 6_000_000, q6: ["none"], q8: 4_000_000 }, [])).toBeNull();
    expect(validateInvestAmount({ q3: 1, q8: 99 }, ["q2"])).toBeNull();
  });
});

describe("wizard progress", () => {
  const sections = [s1, s2];
  it("finds the first incomplete section", () => {
    expect(firstIncomplete(sections, { q1: "a" }, [])).toBe(1);
    expect(firstIncomplete(sections, { q1: "a", q2: 5, q6: ["none"] }, [])).toBe(-1);
  });
  it("resumes at currentSection but never past a gap", () => {
    expect(resumeIndex(sections, "section_2", { q1: "a" }, [])).toBe(1);
    expect(resumeIndex(sections, "section_2", {}, [])).toBe(0);
    expect(resumeIndex(sections, "nope", { q1: "a" }, [])).toBe(0);
  });
});

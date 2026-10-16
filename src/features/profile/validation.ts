import type { Answers, Followup, Question, Section } from "./types";

export type Issue =
  | { code: "required" }
  | { code: "range"; min: number; max: number }
  | { code: "integer" }
  | { code: "choice" }
  | { code: "exclusive" }
  | { code: "q8_exceeds"; surplus: number };

export type Issues = Record<string, Issue>;

const isNone = (v: unknown) => Array.isArray(v) && v.length === 1 && v[0] === "none";

export function followupVisible(q: Question, answers: Answers): boolean {
  const f = q.followup;
  if (!f) return false;
  const v = answers[f.showWhen.qid];
  return Array.isArray(v) && v.length > 0 && !v.some((x) => f.showWhen.notIn.includes(x));
}

/** Toggles an option in a multi-select, keeping the exclusive option (e.g. "none") alone. */
export function toggleMulti(current: string[], id: string, exclusive?: string): string[] {
  if (current.includes(id)) return current.filter((x) => x !== id);
  if (id === exclusive) return [id];
  return [...current.filter((x) => x !== exclusive), id];
}

function validateNumber(v: unknown, min: number, max: number): Issue | null {
  if (typeof v !== "number" || Number.isNaN(v)) return { code: "required" };
  if (!Number.isInteger(v)) return { code: "integer" };
  return v < min || v > max ? { code: "range", min, max } : null;
}

export function validateQuestion(q: Question | Followup, value: unknown, optOut: string[] = []): Issue | null {
  const full = "type" in q ? q : null;
  const empty = value === undefined || value === null || (Array.isArray(value) && value.length === 0);
  if (full && optOut.includes(q.id)) return null;
  if (empty) return full && !full.required ? null : { code: "required" };
  if (!full) return validateNumber(value, (q as Followup).min, (q as Followup).max);
  if (full.type === "numeric") return validateNumber(value, full.min ?? 0, full.max ?? Number.MAX_SAFE_INTEGER);
  const ids = new Set(full.options?.map((o) => o.id));
  if (full.type === "single_choice") return typeof value === "string" && ids.has(value) ? null : { code: "choice" };
  if (!Array.isArray(value) || !value.every((x) => ids.has(x))) return { code: "choice" };
  if (full.exclusiveOption && value.includes(full.exclusiveOption) && value.length > 1) return { code: "exclusive" };
  return null;
}

/** q8 (monthly investing) must fit in the surplus q2 - q3 - q6_installment. Skipped when q2 is opted out or unknown. */
export function validateInvestAmount(answers: Answers, optOut: string[]): Issue | null {
  const q8 = answers.q8;
  if (typeof q8 !== "number" || optOut.includes("q2") || typeof answers.q2 !== "number") return null;
  const q3 = typeof answers.q3 === "number" ? answers.q3 : 0;
  const q6 = answers.q6;
  const inst = !isNone(q6) && typeof answers.q6_installment === "number" ? answers.q6_installment : 0;
  const surplus = answers.q2 - q3 - inst;
  return q8 > surplus ? { code: "q8_exceeds", surplus: Math.max(surplus, 0) } : null;
}

export function validateSection(section: Section, answers: Answers, optOut: string[]): Issues {
  const out: Issues = {};
  for (const q of section.questions) {
    const issue = validateQuestion(q, answers[q.id], optOut);
    if (issue) out[q.id] = issue;
    if (q.followup && followupVisible(q, answers)) {
      const fi = validateQuestion(q.followup, answers[q.followup.id]);
      if (fi) out[q.followup.id] = fi;
    }
  }
  if (!out.q8) {
    const cross = section.questions.some((q) => q.id === "q8") ? validateInvestAmount(answers, optOut) : null;
    if (cross) out.q8 = cross;
  }
  return out;
}

export const validateAll = (sections: Section[], answers: Answers, optOut: string[]) =>
  sections.map((s) => validateSection(s, answers, optOut));

import type { Answers, Section } from "./types";
import { validateSection } from "./validation";

export const sectionComplete = (s: Section, answers: Answers, optOut: string[]) =>
  Object.keys(validateSection(s, answers, optOut)).length === 0;

/** Index of the first section that still has issues, or -1 when everything is valid. */
export const firstIncomplete = (sections: Section[], answers: Answers, optOut: string[]) =>
  sections.findIndex((s) => !sectionComplete(s, answers, optOut));

/** Where to land after loading a draft: the server's currentSection, never past the first incomplete one. */
export function resumeIndex(sections: Section[], currentSection: string, answers: Answers, optOut: string[]): number {
  const wanted = Math.max(sections.findIndex((s) => s.id === currentSection), 0);
  const gap = firstIncomplete(sections, answers, optOut);
  return gap === -1 ? wanted : Math.min(wanted, gap);
}

/** Number of completed sections (0..sections.length). */
export const completedCount = (sections: Section[], answers: Answers, optOut: string[]) =>
  sections.filter((s) => sectionComplete(s, answers, optOut)).length;

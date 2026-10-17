import type { Lang } from "@/features/profile/types";

// Mirrors the option labels of questions q17 (goal) and q19 (horizon) in the questionnaire.
const GOALS: Record<string, [string, string]> = {
  emergency_fund: ["Membangun dana darurat", "Build emergency fund"],
  home_purchase: ["Membeli rumah", "Buy a home"],
  retirement: ["Pensiun", "Retirement"],
  children_education: ["Pendidikan anak", "Children's education"],
  hajj_umrah: ["Haji / Umrah", "Hajj / Umrah"],
  marriage: ["Pernikahan", "Marriage"],
  wealth_growth: ["Pertumbuhan kekayaan", "Wealth growth"],
};

const HORIZONS: Record<string, [string, string]> = {
  lt_1: ["< 1 tahun", "< 1 year"],
  "1_3": ["1–3 tahun", "1–3 years"],
  "3_5": ["3–5 tahun", "3–5 years"],
  "5_10": ["5–10 tahun", "5–10 years"],
  gt_10: ["> 10 tahun", "> 10 years"],
};

/** "some_new_id" -> "Some New Id": an id the map does not know still reads as text instead of a raw key. */
export const humanize = (id: string) => id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const pick = (m: Record<string, [string, string]>, id: string, lang: Lang) => m[id]?.[lang === "id" ? 0 : 1] ?? humanize(id);

export const goalLabel = (id: string, lang: Lang) => pick(GOALS, id, lang);
export const horizonLabel = (id: string, lang: Lang) => pick(HORIZONS, id, lang);

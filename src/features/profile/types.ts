export type Lang = "id" | "en";

export type AnswerValue = string | number | string[];
export type Answers = Record<string, AnswerValue>;

export interface Option {
  id: string;
  labelEn: string;
  labelId: string;
}

export interface Followup {
  id: string;
  textEn: string;
  textId: string;
  unit: string;
  min: number;
  max: number;
  showWhen: { qid: string; notIn: string[] };
}

export interface Question {
  id: string;
  type: "single_choice" | "multi_select" | "numeric";
  required: boolean;
  textEn: string;
  textId: string;
  hintEn?: string;
  hintId?: string;
  unit?: string;
  min?: number;
  max?: number;
  optOutAllowed?: boolean;
  exclusiveOption?: string;
  options?: Option[];
  followup?: Followup;
}

export interface Section {
  id: string;
  nameEn: string;
  nameId: string;
  icon: string;
  questions: Question[];
}

export interface Questionnaire {
  version: string;
  sections: Section[];
}

export interface Consent {
  accepted: boolean;
  whatsappOptIn: boolean;
  acceptedAt: string;
}

export interface Flag {
  code: "impossible_combination" | "consistency" | "provisional" | "high_interest_debt";
  messageEn: string;
  messageId: string;
}

export interface FinancialHealth {
  financialSecurity: number;
  financialSafety: number;
  financialGrowth: number;
  financialWisdom: number;
  financialFreedom: number;
  totalScore: number;
  category: "Really Struggling" | "Struggling" | "Coping" | "Thriving";
}

export interface Explanation {
  locale: Lang;
  source: "llm" | "template";
  model: string | null;
  summary: string;
  risk: string;
  ladder: string;
  health: string;
  nextStep: string;
  disclaimer: string;
}

export interface Result {
  id: string;
  createdAt: string;
  questionnaireVersion: string;
  ruleVersion: string;
  capacityScore: number;
  willingnessScore: number;
  capacityBand: "low" | "medium" | "high";
  willingnessBand: "low" | "medium" | "high";
  finalProfile: "Conservative" | "Moderate" | "Aggressive";
  profileLabel: "provisional" | "final";
  riskScoreEquivalent: number;
  consistencyFlag: boolean;
  knowledgeCapApplied: boolean;
  ladderLevel: number;
  ladderProgress: number;
  emergencyFundMonths: number;
  emergencyTargetMonths: { min: number; max: number };
  briefingPriorities: string[];
  flags: Flag[];
  financialHealth: FinancialHealth;
  metrics: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyInstallment: number;
    monthlySurplus: number;
    savingsRate: number;
    dti: number;
    investableRatio: number;
  };
  gates: { sharia: "yes" | "prefer" | "no"; holdings: string[] };
  explanation: Explanation | null;
}

export interface CanRetake {
  allowed: boolean;
  nextAllowedAt: string | null;
  remainingThisYear: number;
}

export interface ProfileState {
  status: "none" | "draft" | "completed";
  consent: Consent | null;
  answers: Answers;
  optOut: string[];
  currentSection: string;
  updatedAt: string;
  result: Result | null;
  canRetake: CanRetake;
}

export interface SaveResponse {
  answers: Answers;
  optOut: string[];
  currentSection: string;
  missing: string[];
}

export interface SavePayload {
  section?: string;
  answers: Record<string, AnswerValue | null>;
  optOut?: string[];
}

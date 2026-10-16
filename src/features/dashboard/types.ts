/** Typed from documentation/dashboard-contract.md section 2. */

export type AssetClassCode = string;

export interface AssetHit {
  symbol: string;
  name: string;
  assetClass: AssetClassCode;
  currency: string;
  exchange: string;
  lastPrice: number;
  lastTradeDate: string;
}

export interface Holding {
  id: string;
  symbol: string | null;
  name: string;
  subtitle: string;
  assetClass: AssetClassCode;
  assetClassLabelId: string;
  currency: string;
  units: number;
  avgCost: number;
  lastPrice: number;
  lastPriceDate: string;
  marketValue: number;
  costBasis: number;
  change1dPct: number;
  totalReturnPct: number;
  totalReturnIDR: number;
  weightPct: number;
  trend1y: number[];
  isManual: boolean;
  acquiredAt: string;
  dividendsIDR: number;
}

export interface HoldingsResponse {
  items: Holding[];
  totals: Record<string, number>;
}

export interface ManualInstrument {
  name: string;
  assetClass: string;
  currency: "IDR";
  currentPrice: number;
}

export interface CreateHoldingBody {
  symbol?: string;
  manual?: ManualInstrument;
  units: number;
  avgCost: number;
  acquiredAt: string;
}

/** The contract does not define the PATCH body; these are the editable fields. */
export interface UpdateHoldingBody {
  units?: number;
  avgCost?: number;
  acquiredAt?: string;
  currentPrice?: number;
}

export interface Kpi {
  value: number;
  changePct: number;
  sparkline: number[];
}

export type HomeRange = "6M" | "1Y" | "ALL";
export type PortfolioRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface TrendPoint {
  date: string;
  totalAssets: number;
  investmentValue: number;
}

export interface AllocationSlice {
  label: string;
  labelId: string;
  pct: number;
}

export type ProfileStatus = "none" | "draft" | "completed";

export interface HomeData {
  name: string;
  kpis: { totalInvestmentAssets: Kpi; readySavings: Kpi; monthlyExpenses: Kpi; monthlyIncome: Kpi };
  assetTrend: { range: HomeRange; points: TrendPoint[]; total: number; changePct: number; allocation: AllocationSlice[] };
  financialSummary: {
    monthlyIncome: number;
    monthlyExpenses: number;
    liquidSavings: number;
    totalInvestmentAssets: number;
    principalDebt: number;
    dependents: number;
  };
  preferences: { riskProfile: string; riskLevel: number; primaryGoal: string; goalHorizon: string; sharia: string };
  recommendation: {
    textId: string;
    textEn: string;
    allocation: { label: string; pct: number }[];
    source: "rules" | "llm";
    generatedAt: string;
  };
  account: { plan: string };
  profileStatus: ProfileStatus;
}

export interface PerformancePoint {
  date: string;
  value: number;
  cost: number;
}

export interface PortfolioSummaryRow {
  key: string;
  label: string;
  value: number;
  changePct: number;
}

export interface PortfolioData {
  kpis: { totalAssets: Kpi; totalCost: Kpi; unrealizedPnl: Kpi; returnYtd: Kpi };
  performance: { points: PerformancePoint[] };
  summary: PortfolioSummaryRow[];
  holdings: Holding[];
  footer: { count: number; unrealized: number; dividendsAccumulated: number };
}

export type NewsCategory = "capital_markets" | "macro" | "global" | "real_sector";
export type NewsFilter = "all" | NewsCategory;

export interface Article {
  id: string;
  source: string;
  category: NewsCategory;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  tickers: string[];
  sentiment: string | number | null;
  relevantToHoldings: boolean;
  bookmarked: boolean;
}

export interface NewsPage {
  items: Article[];
  nextCursor: string | null;
  lastUpdatedAt: string;
}

export interface WhatsappSettings {
  phone: string | null;
  verified: boolean;
  optIn: boolean;
  sendTimeLocal: string;
  timezone: string;
  lastSentAt: string | null;
}

export interface BriefingPreview {
  text: string;
  slots: { key: string; text: string }[];
  charCount: number;
  trace: unknown;
}

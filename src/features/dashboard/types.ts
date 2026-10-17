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

/** A portfolio page row: a holding, or the profile's cash (edited through the profile, never deleted here). */
export interface HoldingRow extends Holding {
  isCash?: boolean;
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
  holdings: HoldingRow[];
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
  frequency: "daily" | "weekdays" | "weekly";
  language: "id" | "en";
  paused: boolean;
  deliveryIssue: boolean;
}

export interface BriefingPreview {
  text: string;
  slots: { key: string; text: string }[];
  charCount: number;
  trace: unknown;
}

// ---- Discover (docs/discover-contract.md section 2)
export type DiscoverSort = "marketCap" | "lastPrice" | "ret7d" | "ret1y" | "divYield" | "name";
export type SortDir = "asc" | "desc";

export interface DiscoverItem {
  symbol: string;
  name: string;
  assetClass: string;
  assetClassLabelId: string;
  assetClassLabelEn: string;
  exchange: string | null;
  currency: string;
  lastPrice: number | null;
  lastTradeDate: string | null;
  ret7d: number | null;
  ret1y: number | null;
  marketCap: number | null;
  analystTarget: null;
  valuation: { metric: "PE" | "PB" | "PS"; value: number } | null;
  growth: { metric: "E" | "R"; pct: number } | null;
  divYieldPct: number | null;
  industry: string | null;
  starred: boolean;
}

export interface DiscoverPage {
  items: DiscoverItem[];
  nextCursor: string | null;
  total: number;
  asOf: string | null;
}

export interface DiscoverFacets {
  classes: { value: string; labelId: string; labelEn: string; count: number }[];
  exchanges: { value: string; count: number }[];
  industries: { value: string; count: number }[];
}

/** Typed from GET /advice/products (backend matching slice). */
export interface BiText {
  id: string;
  en: string;
}

export interface ProductAsset {
  ticker: string;
  name: string;
  kind: "asset" | "instrument";
  weight: number;
  score: number | null;
  sector?: string;
  held: boolean;
  reason: BiText;
}

export interface ProductClass {
  class: string;
  label: BiText;
  allocation: number;
  currentPct: number;
  unallocated: number;
  assets: ProductAsset[];
}

export interface ProductsResult {
  profile: { riskProfile: string; ladderLevel: number; sharia: string; horizon: string };
  investable: boolean;
  portfolio: ProductClass[];
  flags: { code: string; text: BiText }[];
  trace: {
    targetAllocation: { profile: string; modifiers: string[]; target: Record<string, number> };
    gatesApplied: { gate: string; excluded: number }[];
    shortlist: { class: string; eligible: number; kept: number }[];
    diversificationActions: string[];
  };
  summary: BiText;
  generatedAt: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatCitation {
  n: number;
  title: string;
  page: number | null;
  sourceType: string;
  key: string;
  url?: string | null; // news only
}

/** What the advisor knows about the user: the same facts the backend sends to the AI, no name or contact data. */
export interface AdvisorContext {
  profile: {
    riskProfile: string;
    ladderLevel: number;
    sharia: string;
    horizonYears: number;
    goal: string | null;
    goalAmountIDR?: number;
    incomeIDR: number;
    expensesIDR: number;
    surplusIDR: number;
    installmentIDR: number;
    savingsIDR: number;
    investableIDR: number;
    dependents: number;
    emergencyMonths: number;
    emergencyTargetMonths: number;
    healthCategory?: string;
    healthScore: number;
  };
  holdings: { symbol: string; name: string; assetClass: string; weightPct: number; valueIDR: number }[];
  recommended: { class: string; allocationPct: number }[];
}

/** One progress step of a reply, e.g. "Searching OJK and financial statement sources...". */
export interface TurnEvent {
  sequence: number;
  title: string;
  type: "processing" | "result" | "error";
  status: "in_progress" | "done" | "failed";
  timestamp: string;
}

export interface ChatMessage {
  id: number | string;
  role: ChatRole;
  content: string;
  citations: ChatCitation[] | null;
  turns?: TurnEvent[];
  createdAt: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ChatReply {
  sessionId: string;
  message: ChatMessage;
  grounded: boolean;
}

// Product comparison (POST /advice/compare) and the suitability trail (GET /advice/suitability)
export interface CompareMetrics {
  return1y: number;
  volatility: number;
  sharpe: number | null;
  positiveMonths: number;
  per: number | null;
  pbv: number | null;
  roe: number | null;
  divYield: number | null;
  beta: number | null;
  expenseRatio: number | null;
}

export interface CompareAsset {
  symbol: string;
  name: string;
  class: string;
  classLabel: BiText;
  sector: string;
  currency: string;
  sharia: string;
  geography: string;
  volatilityClass: string;
  liquidity: string;
  metrics: CompareMetrics;
  gate: { eligible: boolean; gate?: string; reason?: string };
  score: { total: number; components: Record<string, number> };
  series: { d: string; v: number }[] | null; // one year rebased to 100
  rank: number;
}

export interface CompareResult {
  profile: { riskProfile: string; ladderLevel: number; sharia: string; horizon: string };
  assets: CompareAsset[];
  best: string;
  highlights: { key: string; symbol: string; text: BiText }[];
  notFound: string[];
  generatedAt: string;
}

export interface SuitabilityRecord {
  id: number;
  kind: "comparison" | "portfolio";
  payload: Record<string, unknown>;
  createdAt: string;
}

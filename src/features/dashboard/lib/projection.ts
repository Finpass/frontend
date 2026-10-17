import type { ProductClass } from "@/features/dashboard/types";

/**
 * Planning assumptions per class: expected annual return and volatility, in percent.
 * Deliberately flat and conservative (not extrapolated from recent returns), so the projection is an
 * illustration of the allocation, not a forecast of any product.
 */
export const ASSUMPTIONS: Record<string, { mu: number; sigma: number }> = {
  equity_large_cap: { mu: 10, sigma: 20 },
  equity_mid_small: { mu: 12, sigma: 30 },
  equity_global: { mu: 9, sigma: 18 },
  etf: { mu: 9, sigma: 18 },
  mutual_fund: { mu: 4.5, sigma: 1 },
  bond_government: { mu: 6.2, sigma: 3 },
  sukuk: { mu: 6.2, sigma: 3 },
  deposits: { mu: 4.5, sigma: 0.5 },
  gold: { mu: 5, sigma: 15 },
  crypto: { mu: 15, sigma: 60 },
  property: { mu: 7, sigma: 10 },
};
const FALLBACK = { mu: 5, sigma: 15 };
const RHO = 0.5; // one flat correlation between classes

export interface PortfolioStats {
  mu: number; // expected annual return, percent
  sigma: number; // annual volatility, percent
}

export function portfolioStats(portfolio: ProductClass[]): PortfolioStats {
  const total = portfolio.reduce((s, c) => s + c.allocation, 0);
  if (total <= 0) return { mu: 0, sigma: 0 };
  let mu = 0;
  let sum = 0;
  let sumSq = 0;
  for (const c of portfolio) {
    const w = c.allocation / total;
    const a = ASSUMPTIONS[c.class] ?? FALLBACK;
    mu += w * a.mu;
    sum += w * a.sigma;
    sumSq += (w * a.sigma) ** 2;
  }
  return { mu, sigma: Math.sqrt(RHO * sum * sum + (1 - RHO) * sumSq) };
}

export interface ProjectionPoint {
  month: number;
  base: number;
  low: number;
  high: number;
}

/** Expected path compounds at mu; the band is about one standard deviation (lognormal) around it. */
export function project(capital: number, s: PortfolioStats, years: number): ProjectionPoint[] {
  const out: ProjectionPoint[] = [];
  for (let m = 0; m <= years * 12; m++) {
    const t = m / 12;
    const base = capital * (1 + s.mu / 100) ** t;
    const band = Math.exp((s.sigma / 100) * Math.sqrt(t));
    out.push({ month: m, base, low: base / band, high: base * band });
  }
  return out;
}

/** Amount per asset given its portfolio weight in percent. */
export const amountFor = (capital: number, weightPct: number) => (capital * weightPct) / 100;

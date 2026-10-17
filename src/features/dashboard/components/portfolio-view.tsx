"use client";

import { useState } from "react";
import { colors } from "@/design-system/colors";
import { userMessage } from "@/lib/api-error";
import { dashboardApi } from "@/features/dashboard/api/dashboard-api";
import { compactIdr, idr, pct } from "@/features/dashboard/lib/format";
import { allocationByClass, classColor } from "@/features/dashboard/lib/holdings";
import { useDash, useResource } from "@/features/dashboard/state/use-dash";
import type { PortfolioData, PortfolioRange } from "@/features/dashboard/types";
import { PerformanceChart } from "./charts";
import { Greeting } from "./financial-view";
import { HoldingsSection } from "./holdings-table";
import { KpiCard, KpiSkeleton } from "./kpi";
import { InlineError, LoadingRegion, Sk, Tabs, card } from "./ui";
import { Donut } from "./rec-charts";

const RANGES: PortfolioRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

export function PortfolioView({ fallbackName }: { fallbackName: string }) {
  const { t } = useDash();
  const [range, setRange] = useState<PortfolioRange>("6M");
  const res = useResource(`portfolio:${range}`, (signal) => dashboardApi.portfolio(range, { signal }));

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <Greeting name={fallbackName} view="portfolio" />
      {!res.data && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
      {!res.data && !res.error && (
        <LoadingRegion label={t.loading}>
          <div className="space-y-6">
            <KpiSkeleton />
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><Sk className="h-96" /><Sk className="h-80" /></div>
            <Sk className="h-96" />
          </div>
        </LoadingRegion>
      )}
      {res.data && (
        <div aria-busy={res.loading} className="space-y-6">
          {res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
          <Kpis d={res.data} />
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <PerformanceCard d={res.data} range={range} onRange={setRange} busy={res.loading} />
            <div className="flex flex-col">
              <AllocationCard d={res.data} />
            </div>
          </div>
          <HoldingsSection items={res.data.holdings} footer={res.data.footer} onChanged={res.reload} />
        </div>
      )}
    </div>
  );
}

function Kpis({ d }: { d: PortfolioData }) {
  const { lang, t } = useDash();
  const k = d.kpis;
  const vs = t.home.vsLastMonth;
  return (
    <section aria-label="KPI" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={t.pf.kpiTotal} value={idr(k.totalAssets.value)} changePct={k.totalAssets.changePct} suffix={vs} sparkline={k.totalAssets.sparkline} color={colors.teal} />
      <KpiCard label={t.pf.kpiCost} value={idr(k.totalCost.value)} changePct={k.totalCost.changePct} suffix={vs} sparkline={k.totalCost.sparkline} color={colors.blue} />
      <KpiCard label={t.pf.kpiPnl} value={idr(k.unrealizedPnl.value)} changePct={k.unrealizedPnl.changePct} suffix={vs} sparkline={k.unrealizedPnl.sparkline} color={colors.accent} />
      <KpiCard label={t.pf.kpiYtd} value={pct(k.returnYtd.value, lang, { digits: 2 })} changePct={k.returnYtd.changePct} suffix={vs} sparkline={k.returnYtd.sparkline} color={colors.cyan} />
    </section>
  );
}

function PerformanceCard({ d, range, onRange, busy }: { d: PortfolioData; range: PortfolioRange; onRange: (r: PortfolioRange) => void; busy: boolean }) {
  const { t } = useDash();
  const pts = d.performance.points;
  return (
    <section aria-labelledby="perf-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="perf-title" className="text-lg font-bold">{t.pf.perfTitle}</h2>
        <Tabs group="perf" label={t.pf.perfTitle} value={range} onChange={onRange} options={RANGES.map((r) => ({ value: r, label: t.pf.ranges[r] }))} size="sm" />
      </div>
      <div role="tabpanel" id="perf-panel" aria-labelledby={`perf-tab-${range}`} aria-busy={busy} className={`mt-5 ${busy ? "opacity-60" : ""}`}>
        {pts.length ? <PerformanceChart points={pts} /> : <p className="py-20 text-center text-sm text-ink/60">{t.pf.perfEmpty}</p>}
        <ul className="mt-2 flex justify-center gap-6 text-xs text-ink/80">
          <li className="flex items-center gap-2"><i aria-hidden className="size-2.5 rounded-full bg-teal" />{t.pf.valueLegend}</li>
          <li className="flex items-center gap-2"><i aria-hidden className="size-2.5 rounded-full bg-blue" />{t.pf.costLegend}</li>
        </ul>
      </div>
    </section>
  );
}

function AllocationCard({ d }: { d: PortfolioData }) {
  const { lang, t } = useDash();
  const rows = allocationByClass(d.holdings);
  if (!rows.length) return null;
  const keys = rows.map((r) => r.key);
  const slices = rows.map((r) => ({ key: r.key, label: r.label, pct: r.pct, color: classColor(r.key, keys) }));
  return (
    <section aria-labelledby="alloc-title" className={`${card} flex flex-1 flex-col p-4`}>
      <h2 id="alloc-title" className="pb-1 text-base font-bold">{t.pf.allocation}</h2>
      <div className="flex flex-1 items-center justify-center"><Donut slices={slices} center={compactIdr(d.kpis.totalAssets.value, lang)} sub={t.pf.allocTotal} /></div>
    </section>
  );
}

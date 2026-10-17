"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { colors } from "@/design-system/colors";
import { useAuth } from "@/features/auth/state/auth-context";
import { profileApi } from "@/features/profile/api/profile-api";
import { SummaryModal } from "@/features/profile/components/summary-modal";
import { userMessage } from "@/lib/api-error";
import { dashboardApi } from "@/features/dashboard/api/dashboard-api";
import { idr } from "@/features/dashboard/lib/format";
import type { AllocationRow } from "@/features/dashboard/lib/holdings";
import { useChrome, useDash, useResource } from "@/features/dashboard/state/use-dash";
import type { HomeData, HomeRange } from "@/features/dashboard/types";
import { AllocationLegend, TrendChart } from "./charts";
import { BotIcon } from "./icons";
import { KpiCard, KpiSkeleton } from "./kpi";
import { Delta, InlineError, LoadingRegion, PageTitle, Sk, Tabs, ViewSwitch, card, focusRing } from "./ui";

const RANGES: HomeRange[] = ["6M", "1Y", "ALL"];

export function Greeting({ name, view }: { name: string; view: "profile" | "portfolio" }) {
  const { t } = useDash();
  return <PageTitle title={t.home.hello.replace("{name}", name)} sub={t.home.sub} right={<ViewSwitch active={view} />} />;
}

export function FinancialView({ fallbackName }: { fallbackName: string }) {
  const { t } = useDash();
  const [range, setRange] = useState<HomeRange>("6M");
  const res = useResource(`home:${range}`, (signal) => dashboardApi.home(range, { signal }));
  const { setPlan } = useChrome();
  const plan = res.data?.account.plan;
  useEffect(() => {
    if (plan) setPlan(plan);
  }, [plan, setPlan]);
  const name = res.data?.name || fallbackName;

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <Greeting name={name} view="profile" />
      {!res.data && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
      {!res.data && !res.error && (
        <LoadingRegion label={t.loading}>
          <div className="space-y-6">
            <KpiSkeleton />
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]"><Sk className="h-96" /><Sk className="h-96" /></div>
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]"><Sk className="h-56" /><Sk className="h-56" /></div>
          </div>
        </LoadingRegion>
      )}
      {res.data && (
        <div aria-busy={res.loading} className="space-y-6">
          {res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
          {res.data.profileStatus !== "completed" && (
            <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
              <div>
                <p className="font-semibold">{t.home.noProfileTitle}</p>
                <p className="text-sm text-ink/70">{t.home.noProfileBody}</p>
              </div>
              <Link href="/onboarding" className={`rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink ${focusRing}`}>{t.home.noProfileCta}</Link>
            </div>
          )}
          <Kpis d={res.data} />
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <TrendCard d={res.data} range={range} onRange={setRange} busy={res.loading} />
            <SummaryCard d={res.data} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <PrefsCard d={res.data} />
            <RecoCard d={res.data} />
          </div>
        </div>
      )}
    </div>
  );
}

function Kpis({ d }: { d: HomeData }) {
  const { t } = useDash();
  const k = d.kpis;
  const vs = t.home.vsLastMonth;
  return (
    <section aria-label="KPI" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={t.home.kpiInvest} value={idr(k.totalInvestmentAssets.value)} changePct={k.totalInvestmentAssets.changePct} suffix={vs} sparkline={k.totalInvestmentAssets.sparkline} color={colors.teal} />
      <KpiCard label={t.home.kpiReady} value={idr(k.readySavings.value)} changePct={k.readySavings.changePct} suffix={vs} sparkline={k.readySavings.sparkline} color={colors.blue} />
      <KpiCard label={t.home.kpiExpenses} value={idr(k.monthlyExpenses.value)} changePct={k.monthlyExpenses.changePct} suffix={vs} sparkline={k.monthlyExpenses.sparkline} color={colors.accent} />
      <KpiCard label={t.home.kpiIncome} value={idr(k.monthlyIncome.value)} changePct={k.monthlyIncome.changePct} suffix={vs} sparkline={k.monthlyIncome.sparkline} color={colors.cyan} />
    </section>
  );
}

function TrendCard({ d, range, onRange, busy }: { d: HomeData; range: HomeRange; onRange: (r: HomeRange) => void; busy: boolean }) {
  const { lang, t } = useDash();
  const tr = d.assetTrend;
  const rows: AllocationRow[] = tr.allocation.map((a) => ({ key: a.label, label: lang === "id" ? a.labelId : a.label, pct: a.pct }));
  return (
    <section aria-labelledby="trend-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="trend-title" className="text-lg font-bold">{t.trend.title}</h2>
          <p className="text-sm text-ink/70">{t.trend.sub.replace("{range}", t.trend.rangeSub[range])}</p>
        </div>
        <Tabs group="trend" label={t.trend.rangeLabel} value={range} onChange={onRange} options={RANGES.map((r) => ({ value: r, label: t.trend.ranges[r] }))} size="sm" />
      </div>
      <div role="tabpanel" id="trend-panel" aria-labelledby={`trend-tab-${range}`} aria-busy={busy} className={`mt-5 grid gap-5 lg:grid-cols-[1fr_16rem] ${busy ? "opacity-60" : ""}`}>
        <div>
          {tr.points.length ? <TrendChart points={tr.points} /> : <p className="py-16 text-center text-sm text-ink/60">{t.trend.empty}</p>}
          <ul className="mt-2 flex justify-center gap-6 text-xs text-ink/80">
            <li className="flex items-center gap-2"><i aria-hidden className="size-3 rounded-[3px] bg-accent" />{t.trend.legendTotal}</li>
            <li className="flex items-center gap-2"><i aria-hidden className="size-3 rounded-full bg-teal" />{t.trend.legendInvest}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-stroke bg-paper/60 p-4">
          <p className="text-xs text-ink/70">{t.trend.now}</p>
          <p className="mt-1 text-2xl font-bold">{idr(tr.total)}</p>
          <Delta value={tr.changePct} suffix={t.home.vsLastMonth} />
          <div className="mt-4 border-t border-stroke pt-4">
            {rows.length ? <AllocationLegend rows={rows} label={t.pf.allocation} /> : <p className="text-sm text-ink/60">{t.trend.allocationEmpty}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ d }: { d: HomeData }) {
  const { t } = useDash();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const prof = useResource(`profile:${user?.id ?? ""}`, () => profileApi.get());
  const shown = prof.data?.status === "completed" ? prof.data : null;
  const leave = async (fn: () => Promise<unknown>) => {
    await fn();
    router.push("/onboarding");
  };
  const s = d.financialSummary;
  const rows: [string, string, boolean?][] = [
    [t.fin.income, idr(s.monthlyIncome)],
    [t.fin.expenses, idr(s.monthlyExpenses)],
    [t.fin.liquid, idr(s.liquidSavings)],
    [t.fin.invest, idr(s.totalInvestmentAssets)],
    [t.fin.debt, idr(s.principalDebt), s.principalDebt === 0],
    [t.fin.dependents, t.fin.people.replace("{n}", String(s.dependents))],
  ];
  return (
    <section aria-labelledby="fin-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3 border-b border-stroke pb-4">
        <h2 id="fin-title" className="text-lg font-bold">{t.fin.title}</h2>
        <button type="button" onClick={() => setOpen(true)} disabled={!shown} className={`rounded text-sm font-medium text-accent disabled:opacity-50 ${focusRing}`}>{t.fin.detail} <span aria-hidden>{"→"}</span></button>
      </div>
      <dl className="divide-y divide-stroke/60 text-sm">
        {rows.map(([k, v, good]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-3.5">
            <dt className="text-ink/75">{k}</dt>
            <dd className={`font-semibold ${good ? "text-gain" : ""}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {open && shown?.result && (
        <SummaryModal
          compact
          result={shown.result}
          canRetake={shown.canRetake}
          onRetake={() => leave(profileApi.retake)}
          onDelete={() => leave(profileApi.remove)}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function PrefsCard({ d }: { d: HomeData }) {
  const { t } = useDash();
  const p = d.preferences;
  const lvl = Math.min(Math.max(Math.round(p.riskLevel), 0), 4);
  const sharia = p.sharia === "yes" ? [t.prefs.shariaYes, t.prefs.shariaYesNote] : p.sharia === "prefer" ? [t.prefs.shariaPrefer, t.prefs.shariaPreferNote] : [t.prefs.shariaNo, t.prefs.shariaNoNote];
  return (
    <section aria-labelledby="prefs-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3 border-b border-stroke pb-4">
        <h2 id="prefs-title" className="text-lg font-bold">{t.prefs.title}</h2>
        <Link href="/onboarding" className={`rounded-lg border border-stroke px-3 py-1.5 text-sm ${focusRing}`}>{t.prefs.edit}</Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stroke bg-paper/60 p-4">
          <p className="text-xs text-ink/70">{t.prefs.risk}</p>
          <p className="mt-2 font-bold">{t.prefs.risks[p.riskProfile] ?? p.riskProfile}</p>
          <div role="img" aria-label={t.prefs.riskLevel.replace("{n}", String(lvl))} className="mt-3 grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 rounded-full ${n <= lvl ? "bg-blue" : "bg-stroke"}`} />)}
          </div>
        </div>
        <div className="rounded-xl border border-stroke bg-paper/60 p-4">
          <p className="text-xs text-ink/70">{t.prefs.goal}</p>
          <p className="mt-2 text-sm font-bold leading-snug">{p.primaryGoal}</p>
          {p.goalHorizon && <p className="mt-1 text-xs text-ink/60">{t.prefs.horizon.replace("{h}", p.goalHorizon)}</p>}
        </div>
        <div className="rounded-xl border border-stroke bg-paper/60 p-4">
          <p className="text-xs text-ink/70">{t.prefs.sharia}</p>
          <p className="mt-2 text-sm font-bold">{sharia[0]}</p>
          <p className="mt-1 text-xs text-ink/60">{sharia[1]}</p>
        </div>
      </div>
    </section>
  );
}

function RecoCard({ d }: { d: HomeData }) {
  const { lang, t } = useDash();
  const r = d.recommendation;
  const text = (lang === "id" ? r.textId : r.textEn) || "";
  return (
    <section aria-labelledby="reco-title" className={`${card} relative overflow-hidden p-5 sm:p-6`}>
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-center gap-5">
        <div className="min-w-0 flex-1">
          <h2 id="reco-title" className="text-base font-bold">{t.reco.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/85">{text || t.reco.empty}</p>
          {text && <p className="mt-3 text-xs text-ink/60">{t.reco.source.replace("{source}", t.reco.sources[r.source])}. {t.reco.disclaimer}</p>}
          <Link href="/dashboard/advisory" className={`mt-4 inline-flex items-center gap-2 rounded-full border border-stroke px-4 py-2 text-sm ${focusRing}`}>{t.reco.ask} <span aria-hidden>{"→"}</span></Link>
        </div>
        <span aria-hidden className="hidden size-24 shrink-0 place-items-center rounded-3xl border border-accent/30 bg-surface text-cyan shadow-[0_0_40px_-10px] shadow-accent sm:grid"><BotIcon className="size-12" /></span>
      </div>
    </section>
  );
}

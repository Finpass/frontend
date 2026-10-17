"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/state/auth-context";
import { profileApi } from "@/features/profile/api/profile-api";
import { RadarChart } from "@/features/profile/components/radar-chart";
import { AXES, BAND_CLASS, bandOf } from "@/features/profile/radar";
import { useProfileLang } from "@/features/profile/state/use-lang";
import type { Result } from "@/features/profile/types";
import { userMessage } from "@/lib/api-error";
import { dashboardApi } from "@/features/dashboard/api/dashboard-api";
import { idr } from "@/features/dashboard/lib/format";
import { goalLabel, horizonLabel } from "@/features/dashboard/lib/goals";
import { useChrome, useDash, useResource } from "@/features/dashboard/state/use-dash";
import type { HomeData } from "@/features/dashboard/types";
import { ExplanationModal } from "./explanation-modal";
import { InlineError, LoadingRegion, PageTitle, Sk, ViewSwitch, card, focusRing } from "./ui";

export function Greeting({ name, view }: { name: string; view: "profile" | "portfolio" }) {
  const { t } = useDash();
  return <PageTitle title={t.home.hello.replace("{name}", name)} sub={t.home.sub} right={<ViewSwitch active={view} />} />;
}

export function FinancialView({ fallbackName }: { fallbackName: string }) {
  const { t } = useDash();
  const { user } = useAuth();
  const res = useResource("home:6M", (signal) => dashboardApi.home("6M", { signal }));
  const prof = useResource(`profile:${user?.id ?? ""}`, () => profileApi.get());
  const [open, setOpen] = useState(false);
  const { setPlan } = useChrome();
  const plan = res.data?.account.plan;
  useEffect(() => {
    if (plan) setPlan(plan);
  }, [plan, setPlan]);
  const name = res.data?.name || fallbackName;
  const done = prof.data?.status === "completed" ? prof.data : null;
  const result = done?.result ?? null;

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <Greeting name={name} view="profile" />
      {!res.data && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
      {!res.data && !res.error && (
        <LoadingRegion label={t.loading}>
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]"><Sk className="h-96" /><Sk className="h-96" /></div>
            <div className="grid gap-6 xl:grid-cols-[35fr_65fr]"><Sk className="h-48" /><Sk className="h-48" /></div>
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
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <HealthCard result={result} />
            <SummaryCard d={res.data} result={result} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[35fr_65fr]">
            <ProfileSummaryCard result={result} onViewAll={result ? () => setOpen(true) : undefined} />
            <PrefsCard d={res.data} result={result} />
          </div>
        </div>
      )}
      {open && result && <ExplanationModal explanation={result.explanation} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Five-axis financial health from the profile assessment: radar plus one bar per axis. */
function HealthCard({ result }: { result: Result | null }) {
  const { t } = useDash();
  const { t: pt } = useProfileLang();
  const r = pt.result;
  const h = result?.financialHealth;
  return (
    <section aria-labelledby="health-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="health-title" className="text-lg font-bold">{t.hv.healthTitle}</h2>
        {h && <p className="text-sm text-ink/70">{r.categories[h.category]}</p>}
      </div>
      {!h ? (
        <p className="py-16 text-center text-sm text-ink/60">{t.hv.healthEmpty}</p>
      ) : (
        <div className="mt-2 grid items-center gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="mx-auto max-w-[19rem]"><RadarChart health={h} /></div>
            <p className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">{r.total}</span>
              <span className={`ml-3 text-3xl font-bold ${BAND_CLASS[bandOf(h.totalScore)].text}`}>{h.totalScore.toFixed(1)}</span>
            </p>
          </div>
          <div className="mx-auto w-full max-w-72">
            <ul className="space-y-3">
              {AXES.map((a) => {
                const v = h[a.key];
                const b = BAND_CLASS[bandOf(v)];
                return (
                  <li key={a.key}>
                    <div className="flex justify-between text-[13px]"><span>{r.axes[a.key]}</span><span className={`font-semibold ${b.text}`}>{v.toFixed(1)}</span></div>
                    <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stroke"><div className={`h-full rounded-full ${b.bar}`} style={{ width: `${Math.min(Math.max(v, 0), 100)}%` }} /></div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-ink/60">{r.legend}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ d, result }: { d: HomeData; result: Result | null }) {
  const { t } = useDash();
  const { t: pt } = useProfileLang();
  const s = d.financialSummary;
  const rows: [string, string, boolean?, string?][] = [
    [t.fin.income, idr(s.monthlyIncome)],
    [t.fin.expenses, idr(s.monthlyExpenses)],
    [t.fin.liquid, idr(s.liquidSavings)],
    [t.fin.invest, idr(s.totalInvestmentAssets)],
    [t.fin.debt, idr(s.principalDebt), s.principalDebt === 0],
    [t.fin.dependents, t.fin.people.replace("{n}", String(s.dependents))],
  ];
  if (result) {
    const tgt = result.emergencyTargetMonths;
    // "25.0 months (target 3-6)": the amount is the value, the target is a muted note under it
    const [, amount = "", target] = /^(.*?)\s*\((.*)\)$/.exec(pt.result.emergencyValue.replace("{m}", result.emergencyFundMonths.toFixed(1)).replace("{t}", tgt.min === tgt.max ? String(tgt.min) : `${tgt.min}-${tgt.max}`)) ?? [];
    rows.push(
      [pt.result.emergency, amount, false, target],
      [pt.result.savingsRate, `${Math.round(result.metrics.savingsRate * 100)}%`],
    );
  }
  return (
    <section aria-labelledby="fin-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3 border-b border-stroke pb-4">
        <h2 id="fin-title" className="text-lg font-bold">{t.fin.title}</h2>
      </div>
      <dl className="divide-y divide-stroke/60 text-sm">
        {rows.map(([k, v, good, note]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-ink/75">{k}</dt>
            <dd className={`text-right font-semibold ${good ? "text-gain" : ""}`}>{v}{note && <span className="block text-xs font-normal text-ink/55">{note}</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PrefsCard({ d, result }: { d: HomeData; result: Result | null }) {
  const { t, lang } = useDash();
  const { t: pt } = useProfileLang();
  const p = d.preferences;
  const lvl = Math.min(Math.max(Math.round(p.riskLevel), 0), 4);
  const sharia = p.sharia === "yes" ? [t.prefs.shariaYes, t.prefs.shariaYesNote] : p.sharia === "prefer" ? [t.prefs.shariaPrefer, t.prefs.shariaPreferNote] : [t.prefs.shariaNo, t.prefs.shariaNoNote];
  const box = "rounded-xl border border-stroke bg-paper/60 p-3.5";
  return (
    <section aria-labelledby="prefs-title" className={`${card} relative flex flex-col overflow-hidden p-5 sm:p-6`}>
      <div aria-hidden className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 size-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3 border-b border-stroke pb-4">
        <h2 id="prefs-title" className="text-lg font-bold">{t.prefs.title}</h2>
        <Link href="/dashboard/settings" className={`rounded-lg border border-stroke px-3 py-1.5 text-sm ${focusRing}`}>{t.prefs.edit}</Link>
      </div>
      <div className="relative mt-5 grid flex-1 content-center gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={box}>
          <p className="text-xs text-ink/70">{t.prefs.risk}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 font-bold">{t.prefs.risks[p.riskProfile] ?? p.riskProfile}{result && <span className="text-xs font-semibold text-ink/70">{result.riskScoreEquivalent.toFixed(1)}/10</span>}</p>
          <div role="img" aria-label={t.prefs.riskLevel.replace("{n}", String(lvl))} className="mt-3 grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 rounded-full ${n <= lvl ? "bg-blue" : "bg-stroke"}`} />)}
          </div>
        </div>
        <div className={box}>
          <p className="text-xs text-ink/70">{t.hv.ladderTitle}</p>
          {result ? (
            <>
              <p className="mt-2 font-bold">{pt.result.ladderLevel.replace("{n}", String(result.ladderLevel))}</p>
              <div aria-hidden className="mt-3 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-1.5 rounded-full ${n <= result.ladderLevel ? "bg-accent" : "bg-stroke"}`} />)}
              </div>
              <p className="mt-2 text-xs text-ink/60">{pt.result.ladderProgress.replace("{p}", String(Math.round(result.ladderProgress)))}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/60">-</p>
          )}
        </div>
        <div className={box}>
          <p className="text-xs text-ink/70">{t.prefs.goal}</p>
          <p className="mt-2 text-sm font-bold leading-snug">{goalLabel(p.primaryGoal, lang)}</p>
          {p.goalHorizon && <p className="mt-1 text-xs text-ink/60">{t.prefs.horizon.replace("{h}", horizonLabel(p.goalHorizon, lang))}</p>}
        </div>
        <div className={box}>
          <p className="text-xs text-ink/70">{t.prefs.sharia}</p>
          <p className="mt-2 text-sm font-bold">{sharia[0]}</p>
          <p className="mt-1 text-xs text-ink/60">{sharia[1]}</p>
        </div>
      </div>
    </section>
  );
}

/** Short profile summary from the rules-based assessment explanation; "View all" opens every description in a popup. */
function ProfileSummaryCard({ result, onViewAll }: { result: Result | null; onViewAll?: () => void }) {
  const { t } = useDash();
  const ex = result?.explanation;
  return (
    <section aria-labelledby="psum-title" className={`${card} flex flex-col p-5 sm:p-6`}>
      <div className="relative flex flex-1 flex-col">
        <h2 id="psum-title" className="text-lg font-bold">{t.hv.summaryTitle}</h2>
        <p className="mt-3 line-clamp-[4] text-justify text-sm leading-relaxed text-ink/85">{ex?.summary || t.hv.summaryEmpty}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
          <button type="button" onClick={onViewAll} disabled={!onViewAll} className={`rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink disabled:opacity-50 ${focusRing}`}>{t.hv.viewAll}</button>
          <Link href="/dashboard/advisory" className={`inline-flex items-center gap-2 rounded-full border border-stroke px-4 py-2 text-sm ${focusRing}`}>{t.reco.ask} <span aria-hidden>{"\u2192"}</span></Link>
        </div>
      </div>
    </section>
  );
}

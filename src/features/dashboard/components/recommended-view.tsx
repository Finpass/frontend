"use client";

import { useMemo, useState } from "react";
import { userMessage } from "@/lib/api-error";
import { adviceApi } from "@/features/dashboard/api/advice-api";
import { compactIdr, idr, pct } from "@/features/dashboard/lib/format";
import { classHue, funnelStats, text } from "@/features/dashboard/lib/matching";
import { amountFor, portfolioStats, project } from "@/features/dashboard/lib/projection";
import { useDash, useResource } from "@/features/dashboard/state/use-dash";
import type { ProductAsset, ProductsResult } from "@/features/dashboard/types";
import { Donut, ProjectionChart } from "./rec-charts";
import { InfoIcon } from "./icons";
import { InlineError, LoadingRegion, PageTitle, Sk, Tabs, ViewSwitch, card, focusRing } from "./ui";

const YEARS = [1, 3, 5, 10] as const;
const QUICK = [10_000_000, 50_000_000, 100_000_000, 500_000_000, 1_000_000_000];
const SHORTLIST = 20;
const fill = (s: string, v: Record<string, string | number>) => Object.entries(v).reduce((a, [k, x]) => a.replace(`{${k}}`, String(x)), s);
const digitsOnly = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export function RecommendedView() {
  const { t } = useDash();
  const m = t.match;
  const res = useResource("advice:products", (signal) => adviceApi.products({ signal }));
  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <PageTitle title={m.title} sub={m.sub} right={<ViewSwitch active="recommended" />} />
      <Notice />
      {!res.data && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
      {!res.data && !res.error && (
        <LoadingRegion label={t.loading}>
          <div className="space-y-6">
            <Sk className="h-20" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-28" />)}</div>
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><Sk className="h-96" /><Sk className="h-80" /></div>
          </div>
        </LoadingRegion>
      )}
      {res.data && <Body d={res.data} />}
    </div>
  );
}

function Notice() {
  const { t } = useDash();
  return (
    <aside role="note" className="flex gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4 sm:p-5">
      <InfoIcon className="mt-0.5 size-5 shrink-0 text-warn" />
      <div>
        <p className="font-semibold text-warn">{t.match.noticeTitle}</p>
        <p className="mt-1 text-sm text-ink/85">{t.match.noticeBody}</p>
      </div>
    </aside>
  );
}

function Body({ d }: { d: ProductsResult }) {
  const { t, lang } = useDash();
  const m = t.match;
  const [raw, setRaw] = useState("100.000.000");
  const [years, setYears] = useState<number>(5);
  const capital = digitsOnly(raw);
  const stats = useMemo(() => portfolioStats(d.portfolio), [d.portfolio]);
  const points = useMemo(() => project(capital, stats, years), [capital, stats, years]);
  const end = points[points.length - 1];
  const keys = d.portfolio.map((c) => c.class);
  const slices = d.portfolio.filter((c) => c.allocation > 0).map((c) => ({ key: c.class, label: text(c.label, lang), pct: c.allocation, color: classHue(c.class, keys) }));
  const rows = d.portfolio.flatMap((c) => c.assets.map((a) => ({ a, c })));
  const nAssets = rows.filter((r) => r.a.kind === "asset").length;
  const gain = capital > 0 ? ((end.base - capital) / capital) * 100 : 0;

  return (
    <div className="space-y-6">
      <section aria-label={m.capital} className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="w-full max-w-sm">
            <label htmlFor="rec-capital" className="text-sm font-medium text-ink/80">{m.capital}</label>
            <div className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-stroke bg-field px-4 focus-within:ring-2 focus-within:ring-accent/70">
              <span className="text-ink/60">Rp</span>
              <input id="rec-capital" inputMode="numeric" value={raw} onChange={(e) => setRaw(digitsOnly(e.target.value) ? digitsOnly(e.target.value).toLocaleString("id-ID") : "")} className="min-w-0 flex-1 bg-transparent font-semibold outline-none" />
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <li key={q}><button type="button" onClick={() => setRaw(q.toLocaleString("id-ID"))} className={`rounded-lg border px-2.5 py-1 text-xs ${focusRing} ${capital === q ? "border-accent text-accent" : "border-stroke text-ink/75 hover:text-ink"}`}>{compactIdr(q, lang)}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink/80">{m.horizon}</p>
            <Tabs group="rec-years" label={m.horizon} value={String(years)} onChange={(v) => setYears(Number(v))} options={YEARS.map((y) => ({ value: String(y), label: fill(m.yearsN, { n: y }) }))} />
          </div>
        </div>
      </section>

      <section aria-label="KPI" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={m.kpiCapital} value={idr(capital)} note={fill(m.kpiAssets, { n: nAssets })} />
        <Stat label={fill(m.kpiProjected, { n: years })} value={idr(end.base)} note={`${gain >= 0 ? "+" : ""}${pct(gain, lang, { digits: 1 })}`} tone={gain >= 0 ? "text-gain" : "text-loss"} />
        <Stat label={m.kpiReturn} value={pct(stats.mu, lang, { digits: 1 })} note={m.kpiAssumed} />
        <Stat label={m.kpiRange} value={`${compactIdr(end.low, lang)} - ${compactIdr(end.high, lang)}`} note={fill(m.kpiVol, { v: pct(stats.sigma, lang, { digits: 1 }) })} />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
        <section aria-labelledby="proj-title" className={`${card} p-5 sm:p-6`}>
          <h2 id="proj-title" className="text-lg font-bold">{m.projTitle}</h2>
          <div role="tabpanel" id="rec-years-panel" aria-labelledby={`rec-years-tab-${years}`} className="mt-5">
            {capital > 0 ? <ProjectionChart points={points} years={years} /> : <p className="py-20 text-center text-sm text-ink/60">{m.capitalEmpty}</p>}
            <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-ink/80">
              <li className="flex items-center gap-2"><i aria-hidden className="size-2.5 rounded-full bg-cyan" />{m.optimistic}</li>
              <li className="flex items-center gap-2"><i aria-hidden className="size-2.5 rounded-full bg-teal" />{m.expected}</li>
              <li className="flex items-center gap-2"><i aria-hidden className="size-2.5 rounded-full bg-loss" />{m.cautious}</li>
            </ul>
          </div>
          <p className="mt-4 border-t border-stroke pt-3 text-xs leading-relaxed text-ink/65">{m.projNote}</p>
        </section>
        <section aria-labelledby="rec-sum-title" className={`${card} p-5`}>
          <h2 id="rec-sum-title" className="border-b border-stroke pb-3 text-base font-bold">{m.summaryTitle}</h2>
          <dl className="divide-y divide-stroke/50 text-sm">
            {[
              [m.profileRisk, m.risks[d.profile.riskProfile] ?? d.profile.riskProfile],
              [m.profileLadder, String(d.profile.ladderLevel)],
              [m.profileSharia, d.profile.sharia === "yes" ? m.shariaYes : d.profile.sharia === "prefer" ? m.shariaPrefer : m.shariaNo],
              [m.profileHorizon, fill(m.horizonYears, { n: d.profile.horizon })],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3"><dt className="text-ink/70">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
        </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="rec-alloc-title" className={`${card} p-5`}>
            <h2 id="rec-alloc-title" className="pb-4 text-base font-bold">{m.allocTitle}</h2>
            {slices.length ? <Donut slices={slices} center={String(nAssets)} sub={m.donutSub} /> : <p className="text-sm text-ink/70">{m.notInvestable}</p>}
          </section>
        </div>
      </div>

      {!d.investable && <p role="status" className="rounded-2xl border border-stroke bg-card p-5 text-sm text-ink/80">{m.notInvestable}</p>}

      <section aria-labelledby="rec-list-title" className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke p-5 sm:px-6">
          <h2 id="rec-list-title" className="text-lg font-bold">{m.listTitle}</h2>
          <p className="text-sm text-ink/70">{fill(m.listCount, { n: rows.length })}</p>
        </div>
        <div role="region" tabIndex={0} aria-label={m.listTitle} className={`overflow-x-auto ${focusRing}`}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-ink/65">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold sm:pl-6">{m.colAsset}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{m.colClass}</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">{m.colWeight}</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">{m.colAmount}</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">{m.score}</th>
                <th scope="col" className="px-3 py-3 pr-5 font-semibold sm:pr-6">{m.colReason}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke/50">
              {rows.map(({ a, c }) => <Row key={`${c.class}:${a.ticker || a.name}`} a={a} cls={text(c.label, lang)} color={classHue(c.class, keys)} capital={capital} />)}
            </tbody>
          </table>
        </div>
      </section>

      <How d={d} />
      <p className="text-xs text-ink/60">{m.footer}</p>
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <p className="text-sm text-ink/70">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
      <p className={`mt-2 text-xs ${tone ?? "text-ink/60"}`}>{note}</p>
    </div>
  );
}

function Row({ a, cls, color, capital }: { a: ProductAsset; cls: string; color: string; capital: number }) {
  const { t, lang } = useDash();
  const m = t.match;
  const inst = a.kind === "instrument";
  const name = inst ? a.name.split(" / ")[lang === "id" ? 0 : 1] ?? a.name : a.name;
  return (
    <tr className="align-top">
      <td className="px-5 py-3.5 sm:pl-6">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {inst ? name : <span className="text-accent">{a.ticker}</span>}
          {a.held && <span className="rounded-full border border-gain/40 px-2 py-0.5 text-[11px] font-semibold text-gain">{m.held}</span>}
          {inst && <span className="rounded-full border border-stroke px-2 py-0.5 text-[11px] font-medium text-ink/70">{m.instrument}</span>}
        </p>
        {!inst && <p className="max-w-60 truncate text-xs text-ink/65">{name}</p>}
      </td>
      <td className="px-3 py-3.5"><span className="inline-flex items-center gap-2 whitespace-nowrap"><i aria-hidden className="size-2.5 rounded-full" style={{ background: color }} />{cls}</span></td>
      <td className="px-3 py-3.5 text-right font-semibold">{pct(a.weight, lang, { digits: 1 })}</td>
      <td className="whitespace-nowrap px-3 py-3.5 text-right">{idr(amountFor(capital, a.weight))}</td>
      <td className="px-3 py-3.5 text-right">{a.score == null ? <span className="text-ink/50">n/a</span> : Math.round(a.score)}</td>
      <td className="px-3 py-3.5 pr-5 text-xs leading-relaxed text-ink/70 sm:pr-6">{text(a.reason, lang)}</td>
    </tr>
  );
}

function How({ d }: { d: ProductsResult }) {
  const { t } = useDash();
  const m = t.match;
  const f = funnelStats(d.trace);
  return (
    <details className={`${card} p-5 sm:p-6`}>
      <summary className="cursor-pointer text-lg font-bold marker:text-ink/60">{m.howTitle}</summary>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink/80">
        {m.how.map((s) => <li key={s}>{fill(s, { n: SHORTLIST })}</li>)}
      </ol>
      <p className="mt-4 text-sm font-medium">{fill(m.funnel, { excluded: f.excluded, eligible: f.eligible, kept: f.kept })}</p>
      {d.trace.diversificationActions.length > 0 && (
        <>
          <h3 className="mt-4 text-sm font-semibold">{m.actions}</h3>
          <ul className="mt-2 space-y-1 text-xs text-ink/70">{d.trace.diversificationActions.map((x) => <li key={x}>{x}</li>)}</ul>
        </>
      )}
    </details>
  );
}

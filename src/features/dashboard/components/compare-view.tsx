"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { userMessage } from "@/lib/api-error";
import { adviceApi } from "@/features/dashboard/api/advice-api";
import { holdingsApi } from "@/features/dashboard/api/dashboard-api";
import { MAX_COMPARE, MIN_COMPARE, SERIES_HEX, askQuestion, fromParams, leaderIndex, num, toggleSymbol } from "@/features/dashboard/lib/compare";
import { useDash, useDebounced, useResource } from "@/features/dashboard/state/use-dash";
import type { CompareAsset, CompareMetrics, CompareResult } from "@/features/dashboard/types";
import { PerfLines, RadarCompare, RiskReturn, ScoreRing } from "./compare-charts";
import { CloseIcon, SparkIcon } from "./icons";
import { InlineError, PageTitle, Sk, card, focusRing } from "./ui";

const fill = (s: string, v: Record<string, string | number>) => Object.entries(v).reduce((a, [k, x]) => a.replace(`{${k}}`, String(x)), s);
const SERIES = ["bg-accent", "bg-teal", "bg-violet", "bg-warn"];

type Row = { key: keyof CompareMetrics; digits: number; suffix: string; high: boolean | null };
const ROWS: Row[] = [
  { key: "return1y", digits: 1, suffix: "%", high: true },
  { key: "volatility", digits: 1, suffix: "%", high: false },
  { key: "sharpe", digits: 2, suffix: "", high: true },
  { key: "positiveMonths", digits: 0, suffix: "", high: true },
  { key: "divYield", digits: 1, suffix: "%", high: true },
  { key: "per", digits: 1, suffix: "", high: false },
  { key: "pbv", digits: 1, suffix: "", high: false },
  { key: "roe", digits: 1, suffix: "%", high: true },
  { key: "beta", digits: 2, suffix: "", high: null },
  { key: "expenseRatio", digits: 2, suffix: "%", high: false },
];

export function CompareView() {
  const { t } = useDash();
  const c = t.cp;
  // a link from Discover or the advisor can carry ?symbols=A,B
  const params = useSearchParams();
  const [start] = useState(() => fromParams(params, "symbols").symbols);
  const [picked, setPicked] = useState<string[]>(start);
  const [ran, setRan] = useState<string[]>(start.length >= MIN_COMPARE ? start : []);

  const res = useResource(`compare:${ran.join(",")}`, (signal) => (ran.length >= MIN_COMPARE ? adviceApi.compare(ran, { signal }) : Promise.resolve(null)));
  const run = () => {
    setRan(picked);
    window.history.replaceState(null, "", `?symbols=${encodeURIComponent(picked.join(","))}`);
  };
  const busy = res.loading && ran.length >= MIN_COMPARE;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title={c.title} sub={c.sub} />
      <Picker picked={picked} onToggle={(s) => setPicked((p) => toggleSymbol(p, s))} onRun={run} busy={busy} />
      {busy ? (
        <Loading />
      ) : res.error ? (
        <InlineError message={/profile/i.test(res.error.message) ? c.needProfile : `${c.error} ${userMessage(res.error)}`} onRetry={res.reload} />
      ) : res.data ? (
        <Result data={res.data} />
      ) : (
        <p className={`${card} px-5 py-10 text-center text-sm text-ink/70`}>{c.empty}</p>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div aria-busy="true" className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => <Sk key={i} className="h-48" />)}
    </div>
  );
}

function Picker({ picked, onToggle, onRun, busy }: { picked: string[]; onToggle: (s: string) => void; onRun: () => void; busy: boolean }) {
  const { t } = useDash();
  const c = t.cp;
  const id = useId();
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 300);
  const hits = useResource(`cmp-search:${dq}`, (signal) => (dq ? holdingsApi.searchAssets(dq, 8, { signal }) : Promise.resolve([])));
  const searching = !!dq && (hits.loading || dq !== q.trim());
  const full = picked.length >= MAX_COMPARE;
  return (
    <section aria-label={c.pick} className={`${card} p-5`}>
      <label htmlFor={id} className="block text-sm font-semibold">{c.searchLabel}</label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={c.searchPlaceholder}
        autoComplete="off"
        className={`mt-2 h-11 w-full rounded-xl border border-stroke bg-field px-3 text-sm ${focusRing}`}
      />
      <div aria-live="polite" className="mt-2 min-h-5 text-xs text-ink/70">
        {searching && c.searching}
        {!searching && dq && hits.error && c.searchError}
        {!searching && dq && !hits.error && hits.data?.length === 0 && c.noResults}
      </div>
      {!searching && !!hits.data?.length && dq && (
        <ul aria-label={c.searchLabel} className="max-h-56 divide-y divide-stroke overflow-y-auto rounded-xl border border-stroke">
          {hits.data.map((a) => {
            const on = picked.includes(a.symbol.toUpperCase());
            return (
              <li key={a.symbol}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={full && !on}
                  onClick={() => onToggle(a.symbol)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-field disabled:opacity-40 ${focusRing} ${on ? "bg-accent/10" : ""}`}
                >
                  <span className="min-w-0 truncate"><b>{a.symbol}</b> <span className="text-ink/70">{a.name}</span></span>
                  <span className="shrink-0 text-xs text-ink/60">{a.exchange}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {picked.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 py-1 pl-3 pr-1 text-sm font-semibold">
            {s}
            <button type="button" aria-label={fill(c.remove, { s })} onClick={() => onToggle(s)} className={`grid size-6 place-items-center rounded-full hover:bg-accent/20 ${focusRing}`}>
              <CloseIcon className="size-3.5" />
            </button>
          </span>
        ))}
        <span className="text-xs text-ink/70">{picked.length < MIN_COMPARE ? c.hint : fill(c.counter, { n: picked.length })}</span>
        <button
          type="button"
          disabled={picked.length < MIN_COMPARE || busy}
          onClick={onRun}
          className={`ml-auto h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-ink disabled:opacity-50 ${focusRing}`}
        >
          {busy ? c.comparing : c.compare}
        </button>
      </div>
    </section>
  );
}

function Result({ data }: { data: CompareResult }) {
  const { t, lang } = useDash();
  const c = t.cp;
  const symbols = data.assets.map((a) => a.symbol);
  return (
    <div className="space-y-6">
      {data.notFound.length > 0 && (
        <p role="status" className="rounded-xl border border-stroke px-4 py-3 text-sm text-ink/80">{fill(c.notFound, { list: data.notFound.join(", ") })}</p>
      )}
      {data.assets.length >= MIN_COMPARE && (
        <>
          <section aria-label={c.fit} className={`grid gap-4 ${data.assets.length === 2 ? "md:grid-cols-2" : data.assets.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
            {data.assets.map((a, i) => <AssetCard key={a.symbol} a={a} best={a.symbol === data.best} tone={SERIES[i]} idx={i} />)}
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={c.radarTitle} sub={c.radarSub}><RadarCompare assets={data.assets} /></ChartCard>
            <ChartCard title={c.scatterTitle} sub={c.scatterSub}><RiskReturn assets={data.assets} /></ChartCard>
          </section>
          <ChartCard title={c.perfTitle} sub={c.perfSub}><PerfLines assets={data.assets} /></ChartCard>
          {data.highlights.length > 0 && (
            <section aria-label={c.highlights} className={`${card} p-5`}>
              <h2 className="text-sm font-semibold text-ink/70">{c.highlights}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.highlights.map((h) => <li key={h.key} className="rounded-lg border border-stroke px-3 py-2 text-sm">{h.text[lang]}</li>)}
              </ul>
            </section>
          )}
          <details className={`${card} p-5`}>
            <summary className={`cursor-pointer text-sm font-semibold ${focusRing}`}>{c.detail}</summary>
            <Figures assets={data.assets} />
          </details>
          <Link
            href={`/dashboard/advisory?compare=${encodeURIComponent(symbols.join(","))}&ask=${encodeURIComponent(askQuestion(symbols, lang))}`}
            className={`inline-flex h-11 items-center gap-2 rounded-xl border border-accent px-5 text-sm font-semibold text-accent hover:bg-accent/10 ${focusRing}`}
          >
            <SparkIcon className="size-4" />
            {c.ask}
          </Link>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className={`${card} p-5`}>
      <h2 className="text-base font-bold">{title}</h2>
      <p className="mt-0.5 text-xs text-ink/70">{sub}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AssetCard({ a, best, tone, idx }: { a: CompareAsset; best: boolean; tone: string; idx: number }) {
  const { t, lang } = useDash();
  const c = t.cp;
  const why = a.gate.gate ? (c.gates as Record<string, string>)[a.gate.gate] ?? a.gate.reason : "";
  return (
    <article className={`${card} flex flex-col p-5 ${best ? "border-accent/60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-bold"><span aria-hidden className={`size-2.5 shrink-0 rounded-full ${tone}`} />{a.symbol}</h3>
          <p className="truncate text-sm text-ink/70">{a.name}</p>
          <p className="mt-0.5 text-xs text-ink/60">{a.classLabel[lang]}</p>
        </div>
        {best ? (
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-primary-ink">{c.best}</span>
        ) : a.gate.eligible ? (
          <span className="shrink-0 rounded-full border border-stroke px-2.5 py-1 text-xs font-semibold text-ink/80">{fill(c.rank, { n: a.rank })}</span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ScoreRing value={a.score.total} color={SERIES_HEX[idx]} />
        <div>
          <p className="text-2xl font-extrabold tabular-nums">{a.score.total.toFixed(1)}</p>
          <p className="text-xs text-ink/70">{c.fit}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm font-semibold ${a.gate.eligible ? "text-gain" : "text-loss"}`}>{a.gate.eligible ? c.eligible : c.excluded}</p>
      {why && <p className="mt-1 text-xs text-ink/70">{why}</p>}
    </article>
  );
}

function Figures({ assets }: { assets: CompareAsset[] }) {
  const { t } = useDash();
  const c = t.cp;
  const textRows: { key: "liquidity" | "sharia"; get: (a: CompareAsset) => string }[] = [
    { key: "liquidity", get: (a) => (c.levels as Record<string, string>)[a.liquidity] ?? a.liquidity },
    { key: "sharia", get: (a) => (c.shariaStatus as Record<string, string>)[a.sharia] ?? a.sharia },
  ];
  return (
    <section aria-label={c.metrics} className="overflow-x-auto">
      <table className="mt-3 w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="text-left text-xs text-ink/60">
            <th scope="col" className="py-2 pr-4 font-medium"><span className="sr-only">{c.metrics}</span></th>
            {assets.map((a) => <th key={a.symbol} scope="col" className="px-2 py-2 text-right font-semibold text-ink">{a.symbol}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke">
          {ROWS.map((r) => {
            const vals = assets.map((a) => a.metrics[r.key] ?? null);
            if (vals.every((v) => v === null)) return null;
            const lead = r.high === null ? -1 : leaderIndex(vals, r.high);
            return (
              <tr key={r.key}>
                <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ink/80">{(c.rows as Record<string, string>)[r.key]}</th>
                {vals.map((v, i) => (
                  <td key={assets[i].symbol} className={`px-2 py-2.5 text-right tabular-nums ${i === lead ? "font-bold text-gain" : ""}`}>{num(v, r.digits, r.suffix)}</td>
                ))}
              </tr>
            );
          })}
          {textRows.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ink/80">{c.rows[r.key]}</th>
              {assets.map((a) => <td key={a.symbol} className="px-2 py-2.5 text-right">{r.get(a)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { notifyError } from "@/lib/notify-error";
import { userMessage } from "@/lib/api-error";
import { discoverApi } from "@/features/dashboard/api/discover-api";
import { shortDate } from "@/features/dashboard/lib/format";
import {
  DEFAULT_QUERY,
  ariaSort,
  classOptions,
  countOptions,
  formatGrowth,
  formatMarketCap,
  formatPrice,
  formatReturn,
  formatValuation,
  formatYield,
  itemClassLabel,
  mergeItems,
  nextSort,
  querySig,
  returnTone,
  type DiscoverQuery,
} from "@/features/dashboard/lib/discover";
import { useDash, useDebounced, useResource } from "@/features/dashboard/state/use-dash";
import type { DiscoverItem, DiscoverPage, DiscoverSort } from "@/features/dashboard/types";
import { ArrowIcon, SearchIcon, StarIcon, StarOutlineIcon } from "./icons";
import { InlineError, LoadingRegion, PageTitle, Sk, Tabs, card, focusRing, selectArrow, selectChevron } from "./ui";

interface More {
  base: DiscoverPage | null;
  items: DiscoverItem[];
  cursor: string | null;
}
interface Stars {
  base: DiscoverPage | null;
  map: Record<string, boolean>;
}

const TONE = { gain: "text-gain", loss: "text-loss", muted: "text-ink/50" } as const;
const select = `h-10 min-w-0 rounded-xl border border-stroke bg-field py-0 pl-3 text-sm ${selectArrow} ${focusRing}`;

export function DiscoverView() {
  const { lang, t } = useDash();
  const d = t.discover;
  const [query, setQuery] = useState<DiscoverQuery>(DEFAULT_QUERY);
  const [text, setText] = useState("");
  const debounced = useDebounced(text, 300);
  const effective = useMemo(() => ({ ...query, q: debounced }), [query, debounced]);
  const sig = querySig(effective);

  const facets = useResource("discover-facets", (signal) => discoverApi.facets({ signal }));
  const first = useResource(`discover:${sig}`, (signal) => discoverApi.assets(effective, null, { signal }));
  const [more, setMore] = useState<More>({ base: null, items: [], cursor: null });
  const [stars, setStars] = useState<Stars>({ base: null, map: {} });
  const [loadingMore, setLoadingMore] = useState(false);

  const base = first.data;
  const extra = base && more.base === base ? more : null;
  const cursor = base ? (extra ? extra.cursor : base.nextCursor) : null;
  const items = useMemo(() => {
    if (!base) return [];
    const all = extra ? mergeItems(base.items, extra.items) : base.items;
    const overrides = stars.base === base ? stars.map : {};
    return all.map((i) => (i.symbol in overrides ? { ...i, starred: overrides[i.symbol] } : i));
  }, [base, extra, stars]);

  const classes = useMemo(() => classOptions(facets.data, lang, d.all), [facets.data, lang, d.all]);
  const exchanges = useMemo(() => countOptions(facets.data?.exchanges), [facets.data]);
  const industries = useMemo(() => countOptions(facets.data?.industries), [facets.data]);

  // a stale-while-revalidate list stays on screen; mark it busy so assistive tech knows
  const refreshing = first.loading && !!base;

  const loadMore = async () => {
    if (!base || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await discoverApi.assets(effective, cursor);
      setMore((m) => {
        const prev = m.base === base ? m.items : [];
        return { base, items: mergeItems(prev, page.items), cursor: page.nextCursor };
      });
    } catch (e) {
      notifyError(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleStar = async (it: DiscoverItem) => {
    if (!base) return;
    const want = !it.starred;
    const set = (v: boolean) => setStars((s) => ({ base, map: { ...(s.base === base ? s.map : {}), [it.symbol]: v } }));
    set(want);
    try {
      await (want ? discoverApi.star(it.symbol) : discoverApi.unstar(it.symbol));
    } catch (e) {
      set(!want);
      notifyError(e);
    }
  };

  const reset = () => {
    setText("");
    setQuery(DEFAULT_QUERY);
  };
  const onlyWatchlist = query.watchlist && effective.q === "" && query.cls === "all" && !query.exchange && !query.industry;
  const filtered = effective.q !== "" || query.cls !== "all" || !!query.exchange || !!query.industry || query.watchlist;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageTitle title={d.title} sub={d.subtitle} />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/60" />
            <input
              type="search"
              aria-label={d.searchLabel}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={d.searchPlaceholder}
              className={`h-10 w-full rounded-xl border border-stroke bg-field pl-9 pr-3 text-sm placeholder:text-ink/50 ${focusRing}`}
            />
          </div>
          <select aria-label={d.exchangeLabel} value={query.exchange} onChange={(e) => setQuery((q) => ({ ...q, exchange: e.target.value }))} className={select} style={{ backgroundImage: selectChevron }}>
            <option value="">{d.allExchanges}</option>
            {exchanges.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select aria-label={d.industryLabel} value={query.industry} onChange={(e) => setQuery((q) => ({ ...q, industry: e.target.value }))} className={`${select} max-w-56`} style={{ backgroundImage: selectChevron }}>
            <option value="">{d.allIndustries}</option>
            {industries.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            type="button"
            aria-pressed={query.watchlist}
            onClick={() => setQuery((q) => ({ ...q, watchlist: !q.watchlist }))}
            className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm ${focusRing} ${query.watchlist ? "border-accent bg-accent/10 font-semibold text-accent" : "border-stroke text-ink/80"}`}
          >
            {query.watchlist ? <StarIcon className="size-4" /> : <StarOutlineIcon className="size-4" />}
            {d.watchlistOnly}
          </button>
        </div>

        <div className="overflow-x-auto">
          <Tabs group="discover-class" label={d.classLabel} value={query.cls} options={classes} onChange={(v) => setQuery((q) => ({ ...q, cls: v }))} size="sm" />
        </div>
        <div id="discover-class-panel" role="tabpanel" aria-labelledby={`discover-class-tab-${query.cls}`} />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/70" aria-live="polite">
          <p>{base ? d.results.replace("{n}", new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US").format(base.total)) : " "}</p>
          {base?.asOf && <p>{d.asOf.replace("{date}", shortDate(base.asOf, lang))}</p>}
        </div>
      </div>

      <section aria-labelledby="discover-table-title" aria-busy={refreshing} className={`${card} mt-3 overflow-hidden ${refreshing ? "opacity-70" : ""}`}>
        <h2 id="discover-table-title" className="sr-only">{d.tableLabel}</h2>
        {first.error && !base ? (
          <div className="p-6"><InlineError message={userMessage(first.error)} onRetry={first.reload} /></div>
        ) : !base ? (
          <LoadingRegion label={d.loadingLabel}>
            <div className="space-y-3 p-4">{Array.from({ length: 10 }, (_, i) => <Sk key={i} className="h-12 w-full" />)}</div>
          </LoadingRegion>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-bold">{d.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">{onlyWatchlist ? d.emptyWatchlist : d.emptyBody}</p>
            {filtered && <button type="button" onClick={reset} className={`mt-5 rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold ${focusRing}`}>{d.reset}</button>}
          </div>
        ) : (
          <Table items={items} sort={query} onSort={(c) => setQuery((q) => ({ ...q, ...nextSort(q, c) }))} onStar={toggleStar} />
        )}
        {first.error && base && <div className="border-t border-stroke p-4"><InlineError message={userMessage(first.error)} onRetry={first.reload} /></div>}
        {base && cursor && items.length > 0 && (
          <div className="flex justify-center border-t border-stroke p-4">
            <button type="button" disabled={loadingMore} onClick={loadMore} className={`h-11 rounded-xl border border-stroke px-6 text-sm font-semibold hover:bg-field disabled:opacity-60 ${focusRing}`}>
              {loadingMore ? d.loadingMore : d.loadMore}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Table({ items, sort, onSort, onStar }: { items: DiscoverItem[]; sort: Pick<DiscoverQuery, "sort" | "dir">; onSort: (c: DiscoverSort) => void; onStar: (i: DiscoverItem) => void }) {
  const { t } = useDash();
  const d = t.discover;
  const th = "bg-surface px-3 py-3 text-left text-xs font-semibold text-ink/70 whitespace-nowrap";
  const sortable = (col: DiscoverSort, label: string, right = false) => (
    <th scope="col" aria-sort={ariaSort(sort, col)} className={`${th} sticky top-0 z-10 ${right ? "text-right" : ""}`}>
      <button type="button" aria-label={d.sortBy.replace("{col}", label)} onClick={() => onSort(col)} className={`inline-flex items-center gap-1 rounded font-semibold hover:text-ink ${focusRing} ${sort.sort === col ? "text-accent" : ""}`}>
        {label}
        {sort.sort === col && <ArrowIcon down={sort.dir === "desc"} aria-hidden />}
      </button>
    </th>
  );
  const plain = (label: string, extra?: React.ReactNode, hint?: string) => (
    <th scope="col" className={`${th} sticky top-0 z-10`} title={hint}>
      <span className="inline-flex items-center gap-1">{label}{extra}</span>
    </th>
  );
  return (
    <div role="region" tabIndex={0} aria-label={`${d.tableLabel}. ${d.scroll}`} className={`max-h-[70vh] overflow-auto ${focusRing}`}>
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <caption className="sr-only">{d.tableLabel}</caption>
        <thead>
          <tr className="border-b border-stroke">
            <th scope="col" aria-sort={ariaSort(sort, "name")} className={`${th} sticky left-0 top-0 z-20 pl-4 sm:pl-6`}>
              <button type="button" aria-label={d.sortBy.replace("{col}", d.colCompany)} onClick={() => onSort("name")} className={`inline-flex items-center gap-1 rounded font-semibold hover:text-ink ${focusRing} ${sort.sort === "name" ? "text-accent" : ""}`}>
                {d.colCompany}
                {sort.sort === "name" && <ArrowIcon down={sort.dir === "desc"} aria-hidden />}
              </button>
            </th>
            {sortable("lastPrice", d.colPrice, true)}
            {sortable("ret7d", d.col7d, true)}
            {sortable("ret1y", d.col1y, true)}
            {sortable("marketCap", d.colCap, true)}
            {plain(d.colValuation, null, d.valuationHint)}
            {plain(d.colGrowth, null, d.growthHint)}
            {sortable("divYield", d.colYield, true)}
            {plain(d.colIndustry)}
            <th scope="col" className={`${th} sticky top-0 z-10 pr-4 text-center sm:pr-6`}><span className="sr-only">{d.colStar}</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => <Row key={i.symbol} i={i} onStar={() => onStar(i)} />)}
        </tbody>
      </table>
    </div>
  );
}

function Row({ i, onStar }: { i: DiscoverItem; onStar: () => void }) {
  const { lang, t } = useDash();
  const d = t.discover;
  const td = "px-3 py-3 align-middle whitespace-nowrap";
  const na = <span className="text-ink/50">{d.na}</span>;
  const ret = (v: number | null) => <span className={`font-semibold ${TONE[returnTone(v)]}`}>{formatReturn(v, lang)}</span>;
  const val = formatValuation(i.valuation, lang);
  const gr = formatGrowth(i.growth, lang);
  const chip = "rounded border border-stroke bg-paper px-1.5 py-0.5 text-[10px] font-bold text-ink/70";
  return (
    <tr className="border-b border-stroke/60 last:border-0 hover:bg-field/40">
      <th scope="row" className="sticky left-0 z-[1] bg-card px-3 py-3 pl-4 text-left font-normal sm:pl-6">
        <p className="font-bold text-accent">{i.symbol}</p>
        <p className="max-w-44 truncate text-xs text-ink/60" title={`${i.name} (${itemClassLabel(i, lang)})`}>{i.name}</p>
      </th>
      <td className={`${td} text-right font-semibold`}>{formatPrice(i.lastPrice, i.currency, lang)}</td>
      <td className={`${td} text-right`}>{ret(i.ret7d)}</td>
      <td className={`${td} text-right`}>{ret(i.ret1y)}</td>
      <td className={`${td} text-right`}>{i.marketCap == null ? na : formatMarketCap(i.marketCap, i.currency, lang)}</td>
      <td className={td}>{val ? <span className="inline-flex items-center gap-2"><span className={chip}>{val.chip}</span><span>{val.text}</span></span> : na}</td>
      <td className={td}>{gr ? <span className="inline-flex items-center gap-2"><span className={chip}>{gr.chip}</span><span className={`font-semibold ${TONE[gr.tone]}`}>{gr.text}</span></span> : na}</td>
      <td className={`${td} text-right`}>{i.divYieldPct == null ? na : formatYield(i.divYieldPct, lang)}</td>
      <td className={`${td} max-w-48 truncate`} title={i.industry ?? undefined}>{i.industry ?? na}</td>
      <td className="px-3 py-3 pr-4 text-center sm:pr-6">
        <button
          type="button"
          aria-pressed={i.starred}
          aria-label={(i.starred ? d.unstar : d.star).replace("{name}", i.symbol)}
          onClick={onStar}
          className={`grid size-9 place-items-center rounded-lg hover:bg-field ${focusRing} ${i.starred ? "text-warn" : "text-ink/50"}`}
        >
          {i.starred ? <StarIcon className="size-5" /> : <StarOutlineIcon className="size-5" />}
        </button>
      </td>
    </tr>
  );
}

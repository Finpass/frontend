"use client";

import { useEffect, useState } from "react";
import { userMessage, toApiError } from "@/lib/api-error";
import toast from "react-hot-toast";
import { newsApi } from "@/features/dashboard/api/dashboard-api";
import { relativeTime } from "@/features/dashboard/lib/format";
import { useChrome, useDash, useDebounced, useNow, useResource } from "@/features/dashboard/state/use-dash";
import type { Article, NewsCategory, NewsFilter, NewsPage } from "@/features/dashboard/types";
import { BookmarkIcon, ClockIcon, VerifiedIcon } from "./icons";
import { InlineError, LoadingRegion, PageTitle, Sk, Tabs, card, focusRing } from "./ui";

const FILTERS: NewsFilter[] = ["all", "capital_markets", "macro", "global", "real_sector"];
const BADGE: Record<NewsCategory, string> = {
  capital_markets: "border-warn/40 bg-warn/10 text-warn",
  macro: "border-gain/40 bg-gain/10 text-gain",
  global: "border-accent/40 bg-accent/10 text-accent",
  real_sector: "border-violet/40 bg-violet/10 text-violet",
};

interface More {
  base: NewsPage | null;
  items: Article[];
  cursor: string | null;
}

export function NewsView() {
  const { t } = useDash();
  const { search, setSearch, setUpdatedAt } = useChrome();
  const [cat, setCat] = useState<NewsFilter>("all");
  const q = useDebounced(search.trim(), 300);
  const res = useResource(`news:${cat}|${q}`, (signal) => newsApi.list({ category: cat, q }, { signal }));
  const [more, setMore] = useState<More>({ base: null, items: [], cursor: null });
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const now = useNow();

  const updated = res.data?.lastUpdatedAt ?? null;
  useEffect(() => {
    setUpdatedAt(updated);
  }, [updated, setUpdatedAt]);
  useEffect(
    () => () => {
      setSearch("");
      setUpdatedAt(null);
    },
    [setSearch, setUpdatedAt],
  );

  const base = res.data;
  const cur = base && more.base === base ? more : null;
  const items = base ? [...base.items, ...(cur?.items ?? [])] : [];
  const cursor = base ? (cur ? cur.cursor : base.nextCursor) : null;

  const loadMore = async () => {
    if (!base || !cursor) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const page = await newsApi.list({ category: cat, q, cursor });
      setMore({ base, items: [...(cur?.items ?? []), ...page.items], cursor: page.nextCursor });
    } catch (e) {
      setMoreError(userMessage(toApiError(e)));
    } finally {
      setLoadingMore(false);
    }
  };

  const toggle = async (a: Article) => {
    const next = !(marks[a.id] ?? a.bookmarked);
    setMarks((m) => ({ ...m, [a.id]: next }));
    try {
      await (next ? newsApi.bookmark(a.id) : newsApi.unbookmark(a.id));
    } catch {
      setMarks((m) => ({ ...m, [a.id]: !next }));
      toast.error(t.news.bookmarkError);
    }
  };

  const [first, ...rest] = items;
  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div className="border-b border-stroke pb-5">
        <PageTitle
          title={t.news.title}
          sub={t.news.subtitle}
          right={<Tabs group="news" label={t.news.categoriesLabel} value={cat} onChange={setCat} options={FILTERS.map((f) => ({ value: f, label: t.news.tabs[f] }))} />}
        />
      </div>
      <div role="tabpanel" id="news-panel" aria-labelledby={`news-tab-${cat}`} aria-busy={res.loading} className="space-y-6">
        {!base && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
        {!base && !res.error && (
          <LoadingRegion label={t.loading}>
            <Sk className="h-56" />
            <div className="mt-6 grid gap-6 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-52" />)}</div>
          </LoadingRegion>
        )}
        {base && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
        {base && items.length === 0 && !res.loading && (
          <p className={`${card} p-10 text-center text-ink/70`}>{q ? t.news.emptySearch : t.news.empty}</p>
        )}
        {first && (
          <div className={res.loading ? "opacity-60" : ""}>
            <p aria-live="polite" className="sr-only">{t.news.results.replace("{n}", String(items.length))}</p>
            <Card a={first} now={now} featured bookmarked={marks[first.id] ?? first.bookmarked} onToggle={() => toggle(first)} />
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {rest.map((a) => (
                <li key={a.id}><Card a={a} now={now} bookmarked={marks[a.id] ?? a.bookmarked} onToggle={() => toggle(a)} /></li>
              ))}
            </ul>
          </div>
        )}
        {moreError && <p role="alert" className="text-center text-sm text-loss">{moreError}</p>}
        {cursor && (
          <div className="text-center">
            <button type="button" disabled={loadingMore} onClick={loadMore} className={`rounded-xl border border-stroke px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${focusRing}`}>
              {loadingMore ? t.news.loadingMore : t.news.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ a, now, featured, bookmarked, onToggle }: { a: Article; now: Date; featured?: boolean; bookmarked: boolean; onToggle: () => void }) {
  const { lang, t } = useDash();
  return (
    <article className={`${card} relative flex h-full flex-col overflow-hidden ${featured ? "min-h-56 p-6 sm:p-8" : "p-5"}`} aria-label={featured ? t.news.featured : undefined}>
      {featured && <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-accent/10 blur-3xl" />}
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${BADGE[a.category] ?? BADGE.global}`}>{t.news.tabs[a.category] ?? a.category}</span>
          {featured && <span className="flex items-center gap-1.5 text-sm text-ink/85"><VerifiedIcon className="text-accent" />{a.source}</span>}
          {a.relevantToHoldings && <span className="rounded-md bg-gain/10 px-2 py-1 text-[11px] font-semibold text-gain">{t.news.relevant}</span>}
        </div>
        <time dateTime={a.publishedAt} className="flex items-center gap-1.5 font-mono text-xs text-ink/60">
          {featured && <ClockIcon className="size-3.5" />}
          {relativeTime(a.publishedAt, now, lang)}
        </time>
      </div>
      <h2 className={`relative mt-4 font-bold leading-tight ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}>
        <a href={a.url} target="_blank" rel="noopener noreferrer" className={`rounded hover:text-accent ${focusRing}`}>
          {a.title}
          <span className="sr-only"> {t.news.opensNew}</span>
        </a>
      </h2>
      <p className={`relative mt-3 text-ink/75 ${featured ? "line-clamp-3 text-sm sm:text-base" : "line-clamp-3 text-sm"}`}>{a.summary}</p>
      {!featured && (
        <div className="relative mt-5 flex items-center justify-between border-t border-stroke pt-3 [margin-top:auto]">
          <span className="text-sm text-ink/80">{a.source}</span>
          <button type="button" aria-pressed={bookmarked} aria-label={`${bookmarked ? t.news.unbookmark : t.news.bookmark}: ${a.title}`} onClick={onToggle} className={`grid size-9 place-items-center rounded-lg hover:bg-field ${focusRing} ${bookmarked ? "text-accent" : "text-ink/70"}`}>
            <BookmarkIcon filled={bookmarked} />
          </button>
        </div>
      )}
      {featured && (
        <button type="button" aria-pressed={bookmarked} aria-label={`${bookmarked ? t.news.unbookmark : t.news.bookmark}: ${a.title}`} onClick={onToggle} className={`absolute bottom-4 right-4 grid size-9 place-items-center rounded-lg hover:bg-field ${focusRing} ${bookmarked ? "text-accent" : "text-ink/70"}`}>
          <BookmarkIcon filled={bookmarked} />
        </button>
      )}
    </article>
  );
}

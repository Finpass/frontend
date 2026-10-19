"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAuth } from "@/features/auth/state/auth-context";
import { idr } from "@/features/dashboard/lib/format";
import { advisoryApi } from "@/features/dashboard/api/advisory-api";
import { fromParams } from "@/features/dashboard/lib/compare";
import { contextRows, mergeMessages, mergeTurns, parseBlocks, parseCitations, relativeTime, safeUrl, sessionTitle } from "@/features/dashboard/lib/advisory";
import { chatErrorText, useAdvisoryRuns, type Run } from "@/features/dashboard/state/advisory-runs";
import { useDash, useNow, useResource } from "@/features/dashboard/state/use-dash";
import { useTypewriter } from "@/features/dashboard/state/use-typewriter";
import type { ChatCitation, ChatMessage, ChatSessionItem, TurnEvent } from "@/features/dashboard/types";
import { BotIcon, ChevronIcon, CloseIcon, PlusIcon, SearchIcon, SparkIcon } from "./icons";
import { Sk, focusRing } from "./ui";

const MAX = 1000;
const fill = (s: string, v: Record<string, string | number>) => Object.entries(v).reduce((a, [k, x]) => a.replace(`{${k}}`, String(x)), s);

/** grounded is only known for replies received in this visit; stored messages fall back to "has citations". */
type Msg = ChatMessage & { grounded?: boolean; fresh?: boolean }; // fresh: arrived in this visit, typed out

export function AdvisoryView() {
  const { t } = useDash();
  const a = t.adv;
  const now = useNow();
  const list = useResource("advisory:sessions", (signal) => advisoryApi.sessions({ signal }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [failed, setFailed] = useState<{ text: string; error: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // arriving from the comparison page: keep the products as context and pre-fill the question (the user still sends it)
  const params = useSearchParams();
  const [arrival] = useState(() => fromParams(params, "compare"));
  const [draft, setDraft] = useState(() => (arrival.symbols.length >= 2 ? arrival.ask.slice(0, MAX) : ""));
  const [cmp, setCmp] = useState<string[]>(() => (arrival.symbols.length >= 2 ? arrival.symbols : []));
  const [q, setQ] = useState("");
  const [live, setLive] = useState<TurnEvent[]>([]);
  const runs = useAdvisoryRuns();
  const run = runs.run;
  // the question keeps running when this page is left; only the conversation it was asked in shows its progress
  const owns = run?.status === "running" && run.sessionId === activeId;
  const busy = run?.status === "running";
  const runId = owns ? run.runId : null;
  const sessionParam = useSearchParams().get("session");
  const restored = useRef(false);
  const seq = useRef(0);
  const localId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight; // not scrollIntoView: that would also scroll the page itself
  }, [msgs, owns, failed, live]);

  // while a reply is being written, poll the steps the AI service reports for this run
  useEffect(() => {
    if (!runId) return;
    let since = 0;
    let stop = false;
    const tick = async () => {
      try {
        const r = await advisoryApi.turns(runId, since);
        if (stop || r.items.length === 0) return;
        since = Math.max(since, ...r.items.map((x) => x.sequence));
        setLive((p) => mergeTurns(p, r.items));
      } catch {
        // progress is cosmetic: a failed poll must never break the reply
      }
    };
    const id = setInterval(tick, 700);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [runId]);

  const follow = useCallback(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  const errText = useCallback((e: unknown) => chatErrorText(e, a), [a]);

  const open = async (id: string) => {
    const my = ++seq.current;
    setActiveId(id);
    setPanel(false);
    setFailed(null);
    setNotice(null);
    setLoadingChat(true);
    setMsgs([]);
    if (runs.run?.status === "done" && runs.run.reply?.sessionId === id) runs.ack(); // opened from the toast: it is seen now
    try {
      const s = await advisoryApi.session(id);
      if (my === seq.current) setMsgs(s.messages);
    } catch {
      if (my === seq.current) setNotice(a.loadError);
    } finally {
      if (my === seq.current) setLoadingChat(false);
    }
  };

  const fresh = () => {
    seq.current++;
    setActiveId(null);
    setMsgs([]);
    setFailed(null);
    setNotice(null);
    setLoadingChat(false);
    setPanel(false);
    inputRef.current?.focus();
  };

  /** retry=true resends the text of the failed message without adding another bubble. */
  const send = (text: string, retry = false) => {
    const body = text.trim();
    if (!body || body.length > MAX || busy) return;
    if (!retry) {
      const m: Msg = { id: `local-${++localId.current}`, role: "user", content: body, citations: null, createdAt: new Date().toISOString() };
      setMsgs((p) => mergeMessages(p, [m]));
      setDraft("");
    }
    setFailed(null);
    setNotice(null);
    setLive([]);
    runs.start({ sessionId: activeId, message: body, compare: cmp });
  };

  // a result for the conversation on screen arrives here; for any other one the provider raises a toast
  const reload = list.reload;
  const onResult = useCallback(
    (r: Run) => {
      if (r.status === "done" && r.reply) {
        const reply = r.reply;
        setActiveId(reply.sessionId);
        setMsgs((p) => mergeMessages(p, [{ ...reply.message, grounded: reply.grounded, fresh: true }]));
        reload();
      } else setFailed({ text: r.text, error: r.error ?? "" });
    },
    [reload],
  );
  const { attach } = runs;
  useEffect(() => {
    attach(activeId, onResult);
    return () => attach(undefined);
  }, [activeId, onResult, attach]);

  // opened from a toast (?session=) or returning to the page while a question is running or was answered meanwhile;
  // deferred a tick because an effect may not set state synchronously
  useEffect(() => {
    const go = (fn: () => void) => queueMicrotask(fn);
    if (sessionParam) {
      go(() => void open(sessionParam));
      return;
    }
    if (restored.current) return;
    restored.current = true;
    const r = runs.run;
    if (r?.status === "done" && r.reply) {
      const id = r.reply.sessionId;
      go(() => void open(id));
    } else if (r?.status === "running") {
      const { sessionId, text } = r;
      go(() => (sessionId ? void open(sessionId) : setMsgs([{ id: "local-pending", role: "user", content: text, citations: null, createdAt: new Date().toISOString() }])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on arrival and when a toast changes ?session=, not on every render
  }, [sessionParam]);

  const remove = async (id: string) => {
    setConfirmId(null);
    try {
      await advisoryApi.remove(id);
      if (id === activeId) fresh();
      list.reload();
    } catch (e) {
      setNotice(`${a.delError} ${errText(e)}`);
    }
  };

  const all = list.data?.items ?? [];
  const items = q.trim() ? all.filter((x) => x.title.toLowerCase().includes(q.trim().toLowerCase())) : all;
  const count = all.length;
  const activeTitle = all.find((x) => x.id === activeId)?.title;
  const sources = uniqueSources(msgs);

  return (
    <div className="relative -mx-4 -mt-6 grid h-[calc(100dvh-4rem)] min-h-[32rem] grid-cols-1 overflow-hidden border-stroke bg-paper sm:-mx-7 lg:-mb-10 lg:grid-cols-[19rem_1fr] xl:grid-cols-[19rem_1fr_20rem]">
      <div className="border-b border-stroke lg:hidden">
        <button type="button" aria-expanded={panel} aria-controls="adv-sessions" onClick={() => setPanel((o) => !o)} className={`flex h-11 w-full items-center justify-between px-4 text-sm font-semibold ${focusRing}`}>
          {fill(a.chatsN, { n: count })}
          <ChevronIcon className={`size-4 transition-transform ${panel ? "rotate-180" : ""}`} />
        </button>
      </div>

      <aside id="adv-sessions" aria-label={a.sessions} className={`${panel ? "flex" : "hidden"} max-h-[50vh] flex-col overflow-hidden border-r border-stroke lg:flex lg:max-h-none`}>
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-lg font-bold">{a.sessionsTitle}</h2>
          <button type="button" onClick={fresh} aria-label={a.newChat} title={a.newChat} className={`grid size-8 place-items-center rounded-lg text-ink/70 hover:bg-card hover:text-ink ${focusRing}`}>
            <PlusIcon className="size-5" />
          </button>
        </div>
        <div className="border-b border-stroke px-5 pb-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
            <input type="search" aria-label={a.searchLabel} value={q} onChange={(e) => setQ(e.target.value)} placeholder={a.searchPlaceholder} className={`h-10 w-full rounded-xl border border-stroke bg-field pl-9 pr-3 text-sm placeholder:text-ink/50 ${focusRing}`} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.loading && !list.data && <div className="space-y-2 p-4"><Sk className="h-14" /><Sk className="h-14" /><Sk className="h-14" /></div>}
          {list.error && !list.data && (
            <p role="alert" className="p-4 text-sm text-loss">
              {a.sessionsError}{" "}
              <button type="button" onClick={list.reload} className={`font-semibold underline ${focusRing}`}>{t.retry}</button>
            </p>
          )}
          {list.data && count === 0 && <p className="p-5 text-sm text-ink/60">{a.noSessions}</p>}
          {list.data && count > 0 && items.length === 0 && <p className="p-5 text-sm text-ink/60">{a.noMatch}</p>}
          <ul>
            {items.map((s) => (
              <SessionRow key={s.id} s={s} active={s.id === activeId} confirming={confirmId === s.id} now={now} onOpen={() => open(s.id)} onAsk={() => setConfirmId(s.id)} onCancel={() => setConfirmId(null)} onConfirm={() => remove(s.id)} />
            ))}
          </ul>
        </div>
      </aside>

      <section aria-label={a.messages} className="flex min-h-0 flex-col">
        {activeTitle && (
          <h1 className="hidden min-w-0 truncate border-b border-stroke px-6 py-4 text-sm font-semibold text-ink sm:block">{activeTitle}</h1>
        )}
        <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" role="log" aria-label={a.messages}>
          <div className="mx-auto max-w-3xl">
            {msgs.length === 0 && !loadingChat && !owns && <Empty onPick={(x) => send(x)} />}
            {loadingChat && <div className="space-y-3"><Sk className="h-16 w-2/3" /><Sk className="ml-auto h-12 w-1/2" /></div>}
            <ul className="space-y-6">
              {msgs.map((m) => (
                <li key={m.id}>
                  <Bubble m={m} now={now} onProgress={follow} />
                </li>
              ))}
            </ul>
            <div role="status" aria-live="polite" className="mt-5">
              {owns && (live.length > 0 ? <Trail turns={live} live /> : (
                <div className="flex items-center gap-2 text-sm text-ink/70">
                  <span aria-hidden className="flex gap-1">
                    {[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${i * 150}ms` }} className="size-1.5 animate-bounce rounded-full bg-accent motion-reduce:animate-none" />)}
                  </span>
                  {a.typing}
                </div>
              ))}
            </div>
            {failed && (
              <div role="alert" className="mt-4 rounded-xl border border-loss/30 bg-loss/10 p-4">
                <p className="text-sm font-semibold text-loss">{a.failed}</p>
                <p className="mt-1 text-sm text-loss">{failed.error}</p>
                <button type="button" onClick={() => send(failed.text, true)} className={`mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink ${focusRing}`}>{a.retry}</button>
              </div>
            )}
            {notice && <p role="alert" className="mt-4 text-sm text-loss">{notice}</p>}
          </div>
        </div>
        {cmp.length >= 2 && (
          <div className="flex items-center gap-2 border-t border-stroke px-4 py-2 text-xs">
            <span className="min-w-0 truncate rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-semibold">{a.cmpChip.replace("{list}", cmp.join(", "))}</span>
            <button type="button" onClick={() => setCmp([])} className={`rounded-lg px-2 py-1 text-ink/70 hover:text-ink ${focusRing}`}>{a.cmpClear}</button>
          </div>
        )}
        <Composer value={draft} onChange={setDraft} onSend={() => send(draft)} disabled={busy} inputRef={inputRef} />
      </section>

      <aside aria-label={a.contextPanel} className="hidden space-y-4 overflow-y-auto border-l border-stroke p-4 xl:block">
        <SourcesPanel sources={sources} />
        <ContextPanel />
      </aside>
    </div>
  );
}

/** One entry per document page across the whole conversation, in order of first use. */
function uniqueSources(msgs: Msg[]): ChatCitation[] {
  const seen = new Set<string>();
  const out: ChatCitation[] = [];
  for (const m of msgs) {
    for (const c of m.citations ?? []) {
      const k = `${c.key}#${c.page}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(c);
      }
    }
  }
  return out;
}

const panelCard = "rounded-2xl border border-stroke bg-card";

function SourcesPanel({ sources }: { sources: ChatCitation[] }) {
  const { t } = useDash();
  const a = t.adv;
  return (
    <details open className={`${panelCard} group p-4`}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-accent [&::-webkit-details-marker]:hidden">
        {a.srcPanel}
        <span className="flex items-center gap-2 text-ink/70">{sources.length}<ChevronIcon className="size-4 transition-transform group-open:rotate-180" /></span>
      </summary>
      {sources.length === 0 ? (
        <p className="mt-3 text-xs text-ink/60">{a.srcNone}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {sources.map((c) => (
            <li key={`${c.key}#${c.page}`} className="text-xs">
              <SourceTitle c={c} />
              <p className="mt-0.5 text-ink/60">{(a.sourceTypes as Record<string, string>)[c.sourceType] ?? c.sourceType}{c.page != null && `, ${fill(a.page, { n: c.page })}`}</p>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

/** News sources link out in a new tab; document sources are plain text. */
function SourceTitle({ c, plain }: { c: ChatCitation; plain?: boolean }) {
  const href = safeUrl(c.url);
  if (!href) return plain ? <>{c.title}</> : <p className="font-semibold">{c.title}</p>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${plain ? "" : "block font-semibold "}text-accent underline-offset-2 hover:underline ${focusRing}`}>{c.title}</a>
  );
}

function ContextPanel() {
  const { t } = useDash();
  const a = t.adv;
  const { user } = useAuth();
  const ctx = useResource(`advisor-context:${user?.id ?? ""}`, (signal) => advisoryApi.context({ signal }));
  const c = ctx.data;
  const rows = c
    ? contextRows(
        c,
        { risk: a.ctxRisk, ladder: a.ctxLadder, level: a.ctxLevel, income: a.ctxIncome, expenses: a.ctxExpenses, surplus: a.ctxSurplus, installment: a.ctxInstallment, savings: a.ctxSavings, investable: a.ctxInvestable, dependents: a.ctxDependents, emergency: a.ctxEmergency, goal: a.ctxGoal, horizon: a.ctxHorizon, sharia: a.ctxSharia, yes: a.ctxYes, health: a.ctxHealth, years: a.ctxYears, months: a.ctxMonths },
        t.prefs.risks,
        idr,
      )
    : [];
  return (
    <details className={`${panelCard} group p-4`}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-accent [&::-webkit-details-marker]:hidden">
        {a.ctxTitle}
        <ChevronIcon className="size-4 text-ink/70 transition-transform group-open:rotate-180" />
      </summary>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-ink/60">{a.ctxNone}</p>
      ) : (
        <>
          <dl className="mt-3 space-y-2 text-xs">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-ink/60">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
            ))}
          </dl>
          {c && c.holdings.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-bold">{a.ctxHoldings}</h3>
              <ul className="mt-2 space-y-1.5 text-xs">
                {c.holdings.slice(0, 8).map((h) => (
                  <li key={`${h.symbol}${h.name}`} className="flex justify-between gap-3"><span className="min-w-0 truncate text-ink/70">{h.symbol || h.name}</span><span className="shrink-0 font-semibold">{h.weightPct}%</span></li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-[11px] leading-snug text-ink/50">{a.ctxPrivacy}</p>
        </>
      )}
    </details>
  );
}

/** Step titles of a reply: live while it is being written, a collapsed "how it was answered" once done. */
function Trail({ turns, live }: { turns: TurnEvent[]; live?: boolean }) {
  const { t } = useDash();
  // live: a single line that is replaced by each new step; the full list shows once the reply is done
  const shown = live ? turns.slice(-1) : turns;
  const list = (
    <ol className="space-y-1.5">
      {shown.map((x, i) => {
        const active = live && i === shown.length - 1 && x.type === "processing";
        return (
          <li key={x.sequence} className={`flex items-center gap-2 text-xs ${x.type === "error" ? "text-loss" : active ? "text-ink" : "text-ink/65"}`}>
            <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${x.type === "error" ? "bg-loss" : active ? "animate-pulse bg-accent motion-reduce:animate-none" : x.type === "result" ? "bg-gain" : "bg-ink/30"}`} />
            {x.title}
          </li>
        );
      })}
    </ol>
  );
  if (live) return <div aria-label={t.adv.trailLabel} className="rounded-2xl border border-stroke bg-card/60 p-3.5">{list}</div>;
  return (
    <details className="group mb-3">
      <summary className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden ${focusRing}`}>
        <SparkIcon className="size-4" />
        {t.adv.trailLabel}
        <ChevronIcon className="size-3.5 -rotate-90 transition-transform group-open:rotate-0" />
      </summary>
      <div className="mt-2 rounded-xl border border-stroke bg-card/60 p-3">{list}</div>
    </details>
  );
}

function SessionRow({ s, active, confirming, now, onOpen, onAsk, onCancel, onConfirm }: { s: ChatSessionItem; active: boolean; confirming: boolean; now: Date; onOpen: () => void; onAsk: () => void; onCancel: () => void; onConfirm: () => void }) {
  const { t, lang } = useDash();
  const a = t.adv;
  if (confirming) {
    return (
      <li className="m-2 rounded-xl border border-loss/30 bg-loss/10 p-3" role="group" aria-label={a.delConfirm}>
        <p className="text-sm text-loss">{a.delConfirm}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" autoFocus onClick={onConfirm} className={`rounded-lg bg-loss px-3 py-1.5 text-xs font-semibold text-paper ${focusRing}`}>{a.delYes}</button>
          <button type="button" onClick={onCancel} className={`rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold ${focusRing}`}>{a.delNo}</button>
        </div>
      </li>
    );
  }
  const title = sessionTitle(s.title, undefined, a.untitled);
  return (
    <li className={`group flex items-center gap-1 border-l-2 ${active ? "border-accent bg-accent/10" : "border-transparent hover:bg-surface"}`}>
      <button type="button" onClick={onOpen} aria-current={active ? "true" : undefined} className={`min-w-0 flex-1 px-4 py-3.5 text-left ${focusRing}`}>
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block text-xs text-ink/60">{relativeTime(s.updatedAt, now, lang)}</span>
      </button>
      <button type="button" onClick={onAsk} aria-label={`${a.del}: ${title}`} className={`mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-ink/60 hover:text-loss ${focusRing}`}>
        <CloseIcon className="size-4" />
      </button>
    </li>
  );
}

function Empty({ onPick }: { onPick: (q: string) => void }) {
  const { t } = useDash();
  const a = t.adv;
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-6 text-center">
      <span aria-hidden className="grid size-14 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"><BotIcon className="size-7" /></span>
      <h2 className="mt-4 text-lg font-semibold">{a.emptyTitle}</h2>
      <p className="mt-1 text-sm text-ink/70">{a.emptyBody}</p>
      <ul className="mt-5 grid w-full gap-2 sm:grid-cols-2">
        {a.suggestions.map((q) => (
          <li key={q}>
            <button type="button" onClick={() => onPick(q)} className={`h-full w-full rounded-xl border border-stroke bg-field px-4 py-3 text-left text-sm hover:border-accent/50 ${focusRing}`}>{q}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({ m, now, onProgress }: { m: Msg; now: Date; onProgress: () => void }) {
  const { t, lang } = useDash();
  const a = t.adv;
  const { shown, typing } = useTypewriter(m.content, m.role === "assistant" && !!m.fresh, onProgress);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-primary px-5 py-3.5 text-sm leading-relaxed text-primary-ink"><span className="sr-only">{a.you}: </span>{m.content}</p>
      </div>
    );
  }
  const cites = m.citations ?? [];
  const blocks = parseBlocks(shown);
  const ungrounded = m.grounded === false || (m.grounded === undefined && cites.length === 0);
  return (
    <div className="min-w-0">
      {m.turns && m.turns.length > 0 && <Trail turns={m.turns} />}
      <div className="space-y-3 break-words text-sm leading-7 text-ink/90 [hyphens:auto]" lang={lang}>
        <span className="sr-only">{a.assistant}: </span>
        {blocks.map((blk, i) =>
          blk.type === "p" ? (
            <p key={i}><Inline text={blk.text} cites={cites} /></p>
          ) : blk.type === "ul" ? (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-accent">
              {blk.items.map((it, j) => <li key={j}><Inline text={it} cites={cites} /></li>)}
            </ul>
          ) : blk.type === "ol" ? (
            <ol key={i} start={blk.start} className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-accent">
              {blk.items.map((it, j) => (
                <li key={j}>
                  <Inline text={it.text} cites={cites} />
                  {it.sub.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-1.5 pl-5 marker:text-accent">
                      {it.sub.map((s, k) => <li key={k}><Inline text={s} cites={cites} /></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <div key={i} className="overflow-x-auto rounded-xl border border-stroke">
              <table className="w-full min-w-max border-collapse text-left text-sm leading-6">
                <thead className="bg-card text-ink/70">
                  <tr>{blk.head.map((h, j) => <th key={j} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {blk.rows.map((r, j) => (
                    <tr key={j} className="border-t border-stroke">
                      {r.map((c, k) => <td key={k} className={`px-3 py-2 ${k === 0 ? "font-medium text-ink/80" : ""}`}><Inline text={c} cites={cites} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        )}
      </div>
      {!typing && (
      <>
      <div className="mt-3 flex items-center gap-3 text-xs text-ink/60">
        {cites.length > 0 && <span className="rounded-full border border-stroke bg-card px-3 py-1 font-medium text-ink/80">{fill(a.srcChip, { n: cites.length })}</span>}
        <time dateTime={m.createdAt}>{relativeTime(m.createdAt, now, lang)}</time>
      </div>
      {cites.length > 0 && (
        <ol className="mt-2 space-y-1 xl:hidden">
          {cites.map((c) => (
            <li key={c.n} id={`src-${m.id}-${c.n}`} tabIndex={-1} className="flex gap-2 rounded-lg px-1 text-xs text-ink/80 outline-none focus:bg-accent/10 target:bg-accent/10">
              <span className="font-semibold text-accent">[{c.n}]</span>
              <span className="min-w-0 break-words">
                <SourceTitle c={c} plain />
                <span className="text-ink/60">{c.page != null && `, ${fill(a.page, { n: c.page })}`}{` · ${(a.sourceTypes as Record<string, string>)[c.sourceType] ?? c.sourceType}`}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {ungrounded && <p className="mt-2 text-xs text-ink/60">{a.ungrounded}</p>}
      </>
      )}
    </div>
  );
}

/** Text with [n] markers shown as small pills; the title of the source is the tooltip. */
function Inline({ text, cites }: { text: string; cites: ChatCitation[] }) {
  const { t } = useDash();
  return (
    <>
      {parseCitations(text, cites.map((c) => c.n)).map((s, i) =>
        s.type === "text" ? (
          <span key={i}>{s.text}</span>
        ) : (
          <span key={i} title={cites.find((c) => c.n === s.n)?.title} aria-label={fill(t.adv.cite, { n: s.n })} className="mx-0.5 inline-block min-w-5 rounded-md bg-accent/15 px-1.5 text-center align-baseline text-[11px] font-semibold leading-5 text-accent">{s.n}</span>
        ),
      )}
    </>
  );
}

function Composer({ value, onChange, onSend, disabled, inputRef }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const { t } = useDash();
  const a = t.adv;
  const empty = !value.trim();
  // grow with the text (a prefilled comparison prompt is several lines); max-h-28 then scrolls
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, inputRef]);
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!empty && !disabled) onSend();
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!empty && !disabled) onSend();
      }}
      className="px-4 pb-4 pt-2 sm:px-6"
    >
      <label htmlFor="adv-input" className="sr-only">{a.inputLabel}</label>
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-3xl border border-stroke bg-surface py-2 pl-5 pr-2 focus-within:ring-2 focus-within:ring-accent/70">
        <textarea id="adv-input" ref={inputRef} rows={1} maxLength={MAX} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey} placeholder={a.inputPlaceholder} className="max-h-40 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-ink/50 disabled:opacity-60" />
        <span className={`${value ? "hidden sm:block" : "hidden"} text-xs ${value.length >= MAX ? "text-warn" : "text-ink/50"}`} aria-hidden>{fill(a.counter, { n: value.length })}</span>
        <button type="submit" disabled={empty || disabled} aria-label={disabled ? a.sending : a.send} className={`grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary-ink disabled:opacity-50 ${focusRing}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden><path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12 2-12 2Z" /></svg>
        </button>
      </div>
      <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-ink/60">{a.notice}</p>
    </form>
  );
}

import type { Lang } from "@/features/profile/types";
import type { AdvisorContext, ChatMessage, TurnEvent } from "@/features/dashboard/types";

export type Segment = { type: "text"; text: string } | { type: "cite"; n: number };

/** Splits an answer into text and citation markers. Only `[n]` with n in `valid` becomes a marker; anything else stays text. */
export function parseCitations(text: string, valid: number[]): Segment[] {
  const ok = new Set(valid);
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[(\d{1,3})\]/g)) {
    const n = Number(m[1]);
    if (!ok.has(n)) continue;
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push({ type: "cite", n });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Appends messages, replacing any with the same id (a reload or retry never duplicates a bubble). */
export function mergeMessages<T extends ChatMessage>(prev: T[], next: T[]): T[] {
  const byId = new Map(next.map((m) => [m.id, m]));
  const kept = prev.map((m) => byId.get(m.id) ?? m);
  const have = new Set(prev.map((m) => m.id));
  return [...kept, ...next.filter((m) => !have.has(m.id))];
}

/** Title shown for a session; falls back to the first 60 characters of the first message. */
export function sessionTitle(title: string | null | undefined, firstMessage: string | undefined, fallback: string): string {
  const t = title?.trim();
  if (t) return t;
  const f = firstMessage?.trim().slice(0, 60);
  return f || fallback;
}

/** "5 minutes ago" style label in the UI language; dates older than a week fall back to a short date. */
export function relativeTime(iso: string, now: Date, lang: Lang): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const loc = lang === "id" ? "id-ID" : "en-US";
  const sec = Math.round((then - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(sec / 86400), "day");
  return new Date(then).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
}

/** Adds newly polled turns to the trail by sequence; polling the same range twice never duplicates a step. */
export function mergeTurns(prev: TurnEvent[], next: TurnEvent[]): TurnEvent[] {
  const bySeq = new Map(prev.map((t) => [t.sequence, t]));
  for (const t of next) bySeq.set(t.sequence, t);
  return [...bySeq.values()].sort((a, b) => a.sequence - b.sequence);
}

export type Block = { type: "p"; text: string } | { type: "ul" | "ol"; items: string[] };

const BULLET = /^\s*[-*\u2022]\s+(.*)$/;
const NUMBERED = /^\s*\d{1,2}[.)]\s+(.*)$/;

/** Turns plain model output into paragraphs and lists. Single line breaks inside a paragraph become spaces; **bold** markers are dropped. */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of text.replace(/\*\*(.+?)\*\*/g, "$1").split("\n")) {
    const line = raw.trim();
    const b = BULLET.exec(line);
    const n = b ? null : NUMBERED.exec(line);
    const item = b?.[1] ?? n?.[1];
    if (item !== undefined) {
      flush();
      const type = b ? "ul" : "ol";
      const last = blocks[blocks.length - 1];
      if (last && last.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
    } else if (line === "") flush();
    else para.push(line);
  }
  flush();
  return blocks;
}

/** Only web links may be opened from a source; anything else (javascript:, data:) is shown as text. */
export const safeUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

export type ContextLabels = Record<"risk" | "ladder" | "level" | "income" | "expenses" | "surplus" | "installment" | "savings" | "investable" | "dependents" | "emergency" | "goal" | "horizon" | "sharia" | "yes" | "health" | "years" | "months", string>;

/** The personal facts the advisor works from, as label/value rows; zero amounts and empty fields are left out. */
export function contextRows(c: AdvisorContext, L: ContextLabels, risks: Record<string, string>, money: (n: number) => string): [string, string][] {
  const p = c.profile;
  const rows: [string, string | null][] = [
    [L.risk, risks[p.riskProfile] ?? p.riskProfile],
    [L.ladder, L.level.replace("{n}", String(p.ladderLevel))],
    [L.income, p.incomeIDR ? money(p.incomeIDR) : null],
    [L.expenses, p.expensesIDR ? money(p.expensesIDR) : null],
    [L.surplus, p.incomeIDR ? money(p.surplusIDR) : null],
    [L.installment, p.installmentIDR ? money(p.installmentIDR) : null],
    [L.savings, p.savingsIDR ? money(p.savingsIDR) : null],
    [L.investable, p.investableIDR ? money(p.investableIDR) : null],
    [L.dependents, String(p.dependents)],
    [L.emergency, p.emergencyMonths || p.emergencyTargetMonths ? `${p.emergencyMonths} / ${p.emergencyTargetMonths} ${L.months}` : null],
    [L.goal, p.goal ? `${p.goal}${p.goalAmountIDR ? `, ${money(p.goalAmountIDR)}` : ""}` : null],
    [L.horizon, `${p.horizonYears} ${L.years}`],
    [L.sharia, p.sharia === "yes" ? L.yes : null],
    [L.health, p.healthCategory ? `${p.healthCategory} ${p.healthScore}` : null],
  ];
  return rows.filter((r): r is [string, string] => r[1] !== null);
}

/** The first `n` characters of an answer, without ever cutting a half-typed `[12` citation marker. */
export function revealed(text: string, n: number): string {
  if (n >= text.length) return text;
  const open = text.lastIndexOf("[", n - 1);
  const cut = open >= 0 && !text.slice(open, n).includes("]") ? open : n;
  return text.slice(0, cut);
}

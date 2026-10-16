"use client";

import { useId, useState } from "react";
import { fmt, pick } from "@/features/profile/i18n";
import { formatIdr, formatNumber, parseIdr } from "@/features/profile/numeric";
import { useProfileLang } from "@/features/profile/state/use-lang";
import type { Followup, Question } from "@/features/profile/types";
import { toggleMulti, type Issue } from "@/features/profile/validation";
import { focusRing } from "./common";

interface Props {
  q: Question;
  value: unknown;
  issue?: Issue | null;
  serverError?: string;
  optedOut: boolean;
  onChange: (v: number | string | string[] | undefined) => void;
  onOptOut: (on: boolean) => void;
  onBlur: () => void;
  children?: React.ReactNode;
}

export function useIssueText() {
  const { t } = useProfileLang();
  return (i: Issue) => {
    switch (i.code) {
      case "range": return fmt(t.err.range, { min: formatNumber(i.min), max: formatNumber(i.max) });
      case "q8_exceeds": return fmt(t.err.q8_exceeds, { surplus: formatIdr(i.surplus) });
      default: return t.err[i.code];
    }
  };
}

function Heading({ id, text, aside }: { id: string; text: string; aside?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <span id={id} className="text-base font-semibold leading-snug sm:text-lg">{text}</span>
      {aside && <span className="shrink-0 text-xs font-semibold text-ink/70">{aside}</span>}
    </div>
  );
}

const cardBase =
  "relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-stroke bg-card px-4 py-3 text-sm transition " +
  "hover:border-accent/50 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/80 motion-reduce:transition-none";

function Choice({ q, value, onChange }: { q: Question; value: unknown; onChange: Props["onChange"] }) {
  const { lang } = useProfileLang();
  const name = useId();
  const opts = q.options ?? [];
  const multi = q.type === "multi_select";
  const selected = multi ? (Array.isArray(value) ? (value as string[]) : []) : value;
  const longest = Math.max(...opts.map((o) => pick(lang, o.labelEn, o.labelId).length), 0);
  const tiles = !multi && (opts.length >= 5 || longest <= 6);
  const cols = tiles ? (opts.length === 5 ? "grid-cols-5" : "grid-cols-3") : opts.length >= 6 && longest <= 30 ? "sm:grid-cols-2" : "";

  return (
    <div className={`grid gap-3 ${cols}`}>
      {opts.map((o, i) => {
        const checked = multi ? (selected as string[]).includes(o.id) : selected === o.id;
        const span = !tiles && cols && opts.length % 2 === 1 && i === opts.length - 1 ? "sm:col-span-2" : "";
        return (
          <label key={o.id} className={`${cardBase} ${tiles ? "justify-center text-center" : ""} ${span}`}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={name}
              value={o.id}
              checked={checked}
              onChange={() => onChange(multi ? toggleMulti(selected as string[], o.id, q.exclusiveOption) : o.id)}
              className="sr-only"
            />
            {multi && (
              <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checked ? "border-accent bg-accent text-primary-ink" : "border-ink/30"}`}>
                {checked && <Check />}
              </span>
            )}
            <span className="flex-1">{pick(lang, o.labelEn, o.labelId)}</span>
            {!multi && !tiles && (
              <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${checked ? "bg-accent text-primary-ink" : "bg-ink/15"}`}>
                {checked && <Check />}
              </span>
            )}
            {tiles && checked && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />}
          </label>
        );
      })}
    </div>
  );
}

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7" /></svg>
);

export function NumericInput({
  label, hint, aside, value, error, disabled, onCommit, onBlur,
}: {
  label: string; hint?: string; aside?: string; value: number | undefined; error?: string; disabled?: boolean;
  onCommit: (v: number | undefined, invalid: boolean) => void; onBlur: () => void;
}) {
  const { t } = useProfileLang();
  const id = useId();
  const [raw, setRaw] = useState<string | null>(null);
  const shown = raw ?? (value === undefined ? "" : formatNumber(value));
  const parsed = raw !== null && raw.trim() ? parseIdr(raw) : null;
  const invalid = raw !== null && raw.trim() !== "" && parsed === null;
  const echo = parsed !== null && formatNumber(parsed) !== raw?.trim() ? fmt(t.echo, { value: formatIdr(parsed) }) : "";
  const err = error || (invalid ? t.err.invalid : "");

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-base font-semibold leading-snug sm:text-lg">{label}</label>
        {aside && <span className="shrink-0 text-xs font-semibold text-ink/70">{aside}</span>}
      </div>
      <div className={`flex h-14 items-center gap-3 rounded-xl bg-field px-4 ring-1 transition focus-within:ring-2 focus-within:ring-accent/80 ${err ? "ring-red-400/70" : "ring-stroke"} ${disabled ? "opacity-50" : ""}`}>
        <span aria-hidden className="text-lg font-bold">Rp</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          disabled={disabled}
          value={shown}
          aria-invalid={Boolean(err)}
          aria-describedby={`${id}-d`}
          onChange={(e) => {
            setRaw(e.target.value);
            const p = e.target.value.trim() ? parseIdr(e.target.value) : null;
            onCommit(p ?? undefined, e.target.value.trim() !== "" && p === null);
          }}
          onBlur={() => {
            if (parsed !== null || raw?.trim() === "") setRaw(null);
            onBlur();
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink/30"
        />
      </div>
      <div id={`${id}-d`} className="mt-1.5 min-h-4 text-xs">
        {err ? <p role="alert" className="text-red-300">{err}</p> : <p className="text-ink/70">{echo || hint || t.numericHint}</p>}
      </div>
    </div>
  );
}

export function QuestionField({ q, value, issue, serverError, optedOut, onChange, onOptOut, onBlur, children }: Props) {
  const { lang, t } = useProfileLang();
  const issueText = useIssueText();
  const headId = useId();
  const text = pick(lang, q.textEn, q.textId);
  const hint = pick(lang, q.hintEn, q.hintId);
  const aside = hint || (q.required ? t.required : t.optional);
  const err = serverError || (issue ? issueText(issue) : "");

  if (q.type === "numeric") {
    return (
      <div>
        <NumericInput
          key={String(optedOut)}
          label={text}
          aside={aside}
          value={typeof value === "number" ? value : undefined}
          error={optedOut ? "" : err}
          disabled={optedOut}
          onCommit={(v) => onChange(v)}
          onBlur={onBlur}
        />
        {q.optOutAllowed && (
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={optedOut} onChange={(e) => onOptOut(e.target.checked)} className={`h-4 w-4 accent-[#8ea2ff] ${focusRing}`} />
            {t.optOutLabel}
            {optedOut && <span className="text-xs text-ink/60">({t.optOutNote})</span>}
          </label>
        )}
        {children}
      </div>
    );
  }

  return (
    <fieldset aria-describedby={err ? `${headId}-e` : undefined}>
      <legend className="contents"><Heading id={headId} text={text} aside={aside} /></legend>
      <Choice q={q} value={value} onChange={onChange} />
      {err && <p id={`${headId}-e`} role="alert" className="mt-2 text-xs text-red-300">{err}</p>}
      {children}
    </fieldset>
  );
}

export function FollowupField({ f, value, error, onChange, onBlur }: { f: Followup; value: unknown; error?: string; onChange: (v: number | undefined) => void; onBlur: () => void }) {
  const { lang } = useProfileLang();
  return (
    <div className="mt-5">
      <NumericInput label={pick(lang, f.textEn, f.textId)} value={typeof value === "number" ? value : undefined} error={error} onCommit={(v) => onChange(v)} onBlur={onBlur} />
    </div>
  );
}

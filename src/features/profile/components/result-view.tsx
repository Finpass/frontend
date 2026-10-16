"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { toApiError } from "@/lib/api-error";
import { notifyError } from "@/lib/notify-error";
import { fmt, pick } from "@/features/profile/i18n";
import { formatIdr } from "@/features/profile/numeric";
import { AXES, BAND_CLASS, bandOf } from "@/features/profile/radar";
import { useProfileLang } from "@/features/profile/state/use-lang";
import type { CanRetake, Result } from "@/features/profile/types";
import { ConfirmDialog, focusRing } from "./common";
import { RadarChart } from "./radar-chart";

const fmtDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "numeric", month: "long", year: "numeric" });

const card = "rounded-2xl border border-stroke bg-card p-5 sm:p-6";
const pct = (n: number) => Math.min(Math.max(n, 0), 100);

export function ResultView({
  result, canRetake, onRetake, onDelete,
}: { result: Result; canRetake: CanRetake; onRetake: () => Promise<void>; onDelete: () => Promise<void> }) {
  const { lang, t } = useProfileLang();
  const r = t.result;
  const [busy, setBusy] = useState<"retake" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const h = result.financialHealth;
  const ex = result.explanation;
  const m = result.metrics;
  const locked = !canRetake.allowed;
  const target = result.emergencyTargetMonths;

  const run = async (kind: "retake" | "delete", fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
      if (kind === "delete") toast.success(r.deleted);
    } catch (e) {
      if (toApiError(e).status === 409) toast.error(fmt(t.err.cooldown, { date: canRetake.nextAllowedAt ? fmtDate(canRetake.nextAllowedAt, lang) : "-" }));
      else notifyError(e);
      setBusy(null);
      setConfirming(false);
    }
  };

  const parts = ex
    ? ([[r.sSummary, ex.summary], [r.sRisk, ex.risk], [r.sLadder, ex.ladder], [r.sHealth, ex.health], [r.sNext, ex.nextStep]] as const)
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{r.title}</h1>
        <p className="mt-2 text-ink/70">{r.subtitle}</p>
      </header>

      <section aria-label={r.profile} className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">{r.profile}</p>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-3xl font-bold">
            {r[result.finalProfile]}
            <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${result.profileLabel === "provisional" ? "border-amber-300/50 text-amber-300" : "border-gain/50 text-gain"}`}>
              {r[result.profileLabel]}
            </span>
          </p>
        </div>
        <dl className="flex gap-6 text-sm">
          <Stat label={r.riskScore} value={result.riskScoreEquivalent.toFixed(1)} />
          <Stat label={r.capacity} value={r.bands[result.capacityBand]} />
          <Stat label={r.willingness} value={r.bands[result.willingnessBand]} />
        </dl>
      </section>

      <section aria-label={r.ladder} className={card}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold">{r.ladder}</h2>
          <p className="text-sm font-semibold text-accent">{fmt(r.ladderLevel, { n: result.ladderLevel })}</p>
        </div>
        <ol className="mt-4 grid grid-cols-5 gap-2" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className={`h-2 rounded-full ${n <= result.ladderLevel ? "bg-accent" : "bg-stroke"}`} />
          ))}
        </ol>
        <div className="mt-4">
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(result.ladderProgress)} aria-label={fmt(r.ladderProgress, { p: Math.round(result.ladderProgress) })} className="h-2 overflow-hidden rounded-full bg-stroke">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct(result.ladderProgress)}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink/70">{fmt(r.ladderProgress, { p: Math.round(result.ladderProgress) })}</p>
        </div>
      </section>

      <section aria-label={r.health} className={card}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold">{r.health}</h2>
          <p className="text-sm text-ink/70">{r.categories[h.category]}</p>
        </div>
        <RadarChart health={h} />
        <p className="text-center text-xs text-ink/60">{r.legend}</p>
        <p className="mt-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">{r.total}</span>
          <span className={`ml-3 text-3xl font-bold ${BAND_CLASS[bandOf(h.totalScore)].text}`}>{h.totalScore.toFixed(1)}</span>
        </p>
        <ul className="mt-5 space-y-3">
          {AXES.map((a) => {
            const v = h[a.key];
            const b = BAND_CLASS[bandOf(v)];
            return (
              <li key={a.key}>
                <div className="flex justify-between text-sm">
                  <span>{r.axes[a.key]}</span>
                  <span className={`font-semibold ${b.text}`}>{v.toFixed(1)}</span>
                </div>
                <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-stroke">
                  <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${pct(v)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stroke pt-5 text-sm sm:grid-cols-4">
          <Stat label={r.emergency} value={fmt(r.emergencyValue, { m: result.emergencyFundMonths.toFixed(1), t: target.min === target.max ? target.min : `${target.min}-${target.max}` })} />
          <Stat label={r.surplus} value={formatIdr(m.monthlySurplus)} />
          <Stat label={r.savingsRate} value={`${Math.round(m.savingsRate * 100)}%`} />
          <Stat label={r.dti} value={`${Math.round(m.dti * 100)}%`} />
        </dl>
      </section>

      {result.flags.length > 0 && (
        <section aria-label={r.flags} className={card}>
          <h2 className="text-lg font-bold">{r.flags}</h2>
          <ul className="mt-3 space-y-2">
            {result.flags.map((f) => (
              <li key={f.code} className="rounded-xl bg-amber-300/10 px-4 py-3 text-sm text-amber-200">{pick(lang, f.messageEn, f.messageId)}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label={r.explanation} className={card}>
        <h2 className="text-lg font-bold">{r.explanation}</h2>
        {ex ? (
          <>
            <div className="mt-3 space-y-4">
              {parts.map(([title, body]) => body && (
                <div key={title}>
                  <h3 className="text-sm font-semibold text-accent">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/90">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-ink/60">{fmt(r.sourceLabel, { source: ex.source })}</p>
            <p className="mt-1 text-xs text-ink/70">{ex.disclaimer}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-ink/70">{r.noExplanation}</p>
        )}
      </section>

      <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-center">
        <Link href="/dashboard" className={`flex h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-ink ${focusRing}`}>
          {r.goDashboard}
        </Link>
        <div>
          <button
            type="button"
            disabled={locked || busy !== null}
            onClick={() => run("retake", onRetake)}
            className={`h-12 w-full rounded-xl border border-stroke px-6 font-semibold disabled:opacity-50 sm:w-auto ${focusRing}`}
          >
            {busy === "retake" ? r.retaking : r.retake}
          </button>
          <p className="mt-1.5 text-xs text-ink/70">
            {locked && canRetake.nextAllowedAt ? fmt(r.retakeLocked, { date: fmtDate(canRetake.nextAllowedAt, lang) }) : fmt(r.retakeLeft, { n: canRetake.remainingThisYear })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`h-12 rounded-xl border border-red-400/40 px-6 font-semibold text-red-300 hover:bg-red-400/10 sm:ml-auto ${focusRing}`}
        >
          {r.del}
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          title={r.delTitle}
          body={r.delBody}
          confirm={busy === "delete" ? r.deleting : r.delConfirm}
          cancel={r.delCancel}
          pending={busy === "delete"}
          onConfirm={() => run("delete", onDelete)}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink/60">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

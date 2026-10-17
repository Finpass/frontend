"use client";

import { Brand } from "@/components/brand";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/state/auth-context";
import { notifyError } from "@/lib/notify-error";
import { userMessage } from "@/lib/api-error";
import { fmt, pick } from "@/features/profile/i18n";
import { firstIncomplete } from "@/features/profile/progress";
import { ProfileLangProvider, useProfileLang } from "@/features/profile/state/use-lang";
import { useProfile } from "@/features/profile/state/use-profile";
import { followupVisible, validateSection, type Issues } from "@/features/profile/validation";
import { ConsentStep } from "./consent-step";
import { ErrorPanel, LangToggle, PageSkeleton, focusRing } from "./common";
import { FollowupField, QuestionField } from "./question-field";

export function OnboardingFlow() {
  return (
    <ProfileLangProvider>
      <Shell />
    </ProfileLangProvider>
  );
}

function Shell() {
  const { t } = useProfileLang();
  return (
    <div className="font-app min-h-screen bg-paper text-ink">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-stroke px-5 sm:px-12">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className={`font-display text-xl uppercase tracking-wide ${focusRing}`}>
            <Brand />
          </Link>
          <span aria-hidden className="hidden h-5 w-px bg-stroke sm:block" />
          <p className="hidden truncate text-xs uppercase tracking-widest text-ink/60 sm:block">{t.tagline}</p>
        </div>
        <LangToggle />
      </header>
      <Gate />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-10 sm:pt-14">{children}</main>;
}

function Gate() {
  const { status, openAuth } = useAuth();
  const { t } = useProfileLang();
  const asked = useRef(false);

  useEffect(() => {
    if (status === "guest" && !asked.current) {
      asked.current = true;
      openAuth("register");
    }
  }, [status, openAuth]);

  if (status === "loading") return <Centered><PageSkeleton /></Centered>;
  if (status === "guest") {
    return (
      <Centered>
        <h1 className="text-3xl font-bold tracking-tight">{t.signInTitle}</h1>
        <p className="mt-3 text-ink/70">{t.signInBody}</p>
        <button onClick={() => openAuth("register")} className={`mt-6 h-12 rounded-xl bg-primary px-6 font-semibold text-primary-ink ${focusRing}`}>{t.signInCta}</button>
      </Centered>
    );
  }
  return <Profile />;
}

function Profile() {
  const router = useRouter();
  const { lang, t } = useProfileLang();
  const p = useProfile(lang);
  const finished = p.stage === "result" && Boolean(p.result);
  // a finished (or already completed) profile has nothing left to fill in: the dashboard shows the result
  useEffect(() => {
    if (finished) router.replace("/dashboard");
  }, [finished, router]);

  if (p.phase === "loading") return <Centered><PageSkeleton /></Centered>;
  if (p.phase === "error" || !p.questionnaire || !p.profile) {
    return <Centered><ErrorPanel message={p.loadError ? userMessage(p.loadError) : t.loadError} onRetry={p.load} /></Centered>;
  }
  if (p.stage === "consent") return <Centered><ConsentStep onAccept={p.acceptConsent} /></Centered>;
  if (finished) return <Centered><PageSkeleton /></Centered>;
  return <Wizard p={p} />;
}

function Wizard({ p }: { p: ReturnType<typeof useProfile> }) {
  const { lang, t } = useProfileLang();
  const sections = p.questionnaire!.sections;
  const section = sections[p.index];
  const last = p.index === sections.length - 1;
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const top = useRef<HTMLHeadingElement>(null);

  const issues: Issues = validateSection(section, p.answers, p.optOut);
  const showAll = attempted.has(p.index);
  // before the first Next, only surface problems on fields the user has already filled in
  const visible = (id: string) => {
    const i = issues[id];
    if (!i) return null;
    return showAll || (i.code !== "required" && p.answers[id] !== undefined) ? i : null;
  };

  const reach = firstIncomplete(sections, p.answers, p.optOut);
  const maxReached = reach === -1 ? sections.length - 1 : reach;

  useEffect(() => {
    top.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [p.index]);

  const next = async () => {
    setFormError("");
    if (Object.keys(issues).length) {
      setAttempted((s) => new Set(s).add(p.index));
      document.querySelector<HTMLElement>("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ block: "center" });
      return;
    }
    if (!last) return void p.goTo(p.index + 1);
    setSubmitting(true);
    const out = await p.submit();
    setSubmitting(false);
    if (out.issues) {
      const bad = out.issues.findIndex((x) => Object.keys(x).length);
      setAttempted((s) => new Set(s).add(bad));
      setFormError(t.err.submit);
      void p.goTo(bad);
    } else if (out.error) {
      const e = out.error;
      if (e.status === 409) setFormError(fmt(t.err.cooldown, { date: p.profile?.canRetake.nextAllowedAt ?? "-" }));
      else if (e.status === 422) setFormError(t.err.submit);
      else notifyError(e);
    }
  };

  return (
    <>
      <main className="mx-auto w-full max-w-[720px] px-5 pb-40 pt-10 sm:pt-14">
        <div className="mb-2 flex items-center justify-between text-xs text-ink/70">
          <span>{fmt(t.stepOf, { n: p.index + 1, total: sections.length })}</span>
          <SaveBadge state={p.saveState} onRetry={() => void p.flush()} />
        </div>
        <h1 ref={top} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none sm:text-4xl">{pick(lang, section.nameEn, section.nameId)}</h1>
        <p className="mt-3 max-w-xl text-ink/80">{t.subtitles[p.index] ?? ""}</p>

        <form noValidate onSubmit={(e) => { e.preventDefault(); void next(); }} className="mt-10 space-y-10">
          {section.questions.map((q) => (
            <QuestionField
              key={q.id}
              q={q}
              value={p.answers[q.id]}
              issue={visible(q.id)}
              serverError={p.serverIssues[q.id]}
              optedOut={p.optOut.includes(q.id)}
              onChange={(v) => p.setAnswer(q.id, v)}
              onOptOut={(on) => p.setOptedOut(q.id, on)}
              onBlur={() => void p.flush()}
            >
              {q.followup && followupVisible(q, p.answers) && (
                <FollowupField
                  f={q.followup}
                  value={p.answers[q.followup.id]}
                  error={visible(q.followup.id) ? t.err.required : p.serverIssues[q.followup.id]}
                  onChange={(v) => p.setAnswer(q.followup!.id, v)}
                  onBlur={() => void p.flush()}
                />
              )}
            </QuestionField>
          ))}
        </form>

        <aside className="mt-12 flex gap-3 rounded-2xl border border-stroke bg-card p-4 text-sm">
          <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></svg>
          <div>
            <p className="font-semibold">{p.index === 0 ? t.privacyIdentityTitle : t.privacyDataTitle}</p>
            <p className="mt-1 text-ink/80">{p.index === 0 ? t.privacyIdentity : t.privacyData}</p>
          </div>
        </aside>
        {formError && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{formError}</p>}
      </main>

      <nav aria-label={t.stepperLabel} className="fixed inset-x-0 bottom-0 z-40 border-t border-stroke bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:px-8 sm:py-4">
          <button type="button" onClick={() => void p.goTo(p.index - 1)} disabled={p.index === 0} className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-40 ${focusRing}`}>
            <span aria-hidden>&larr;</span><span className="hidden sm:inline">{t.back}</span><span className="sr-only sm:hidden">{t.back}</span>
          </button>
          <ol className="flex items-center gap-1 sm:gap-2">
            {sections.map((s, i) => {
              const active = i === p.index;
              const done = i < p.index;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-current={active ? "step" : undefined}
                    disabled={i > maxReached && !active}
                    onClick={() => void p.goTo(i)}
                    className={`rounded-lg px-2 py-1.5 text-xs font-semibold disabled:opacity-40 sm:px-3 ${focusRing} ${active ? "bg-accent text-primary-ink" : done ? "text-ink" : "text-ink/70 hover:text-ink"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                    <span className={active ? "ml-1.5 hidden sm:inline" : "ml-1.5 hidden lg:inline"}>{t.sections[i]}</span>
                    <span className="sr-only sm:hidden">{t.sections[i]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={() => void next()} disabled={submitting} className={`flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-ink shadow-[0_0_24px_-4px_rgba(180,195,255,0.45)] transition hover:brightness-110 disabled:opacity-60 sm:px-6 ${focusRing}`}>
            {last ? t.finish : t.next}<span aria-hidden>{last ? "✓" : "→"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function SaveBadge({ state, onRetry }: { state: string; onRetry: () => void }) {
  const { t } = useProfileLang();
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-2">
      {state === "saving" && t.saving}
      {state === "saved" && <span className="text-gain">{t.saved}</span>}
      {(state === "error" || state === "offline") && (
        <>
          <span className="text-red-300">{state === "offline" ? t.offline : t.saveError}</span>
          <button type="button" onClick={onRetry} className={`underline ${focusRing}`}>{t.retry}</button>
        </>
      )}
    </span>
  );
}

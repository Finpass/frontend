"use client";

import { useState } from "react";
import { notifyError } from "@/lib/notify-error";
import { useProfileLang } from "@/features/profile/state/use-lang";
import { focusRing } from "./common";

export function ConsentStep({ onAccept }: { onAccept: (whatsapp: boolean) => Promise<void> }) {
  const { t } = useProfileLang();
  const [agree, setAgree] = useState(false);
  const [wa, setWa] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    try {
      await onAccept(wa);
    } catch (e) {
      notifyError(e);
      setPending(false);
    }
  };

  return (
    <section aria-labelledby="consent-title">
      <h1 id="consent-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.consent.title}</h1>
      <p className="mt-3 text-ink/80">{t.consent.intro}</p>
      <ul className="mt-6 space-y-3 rounded-2xl border border-stroke bg-card p-5 text-sm text-ink/90">
        {t.consent.points.map((p) => (
          <li key={p} className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} className={`mt-0.5 h-5 w-5 accent-[#8ea2ff] ${focusRing}`} />
          {t.consent.whatsapp}
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className={`mt-0.5 h-5 w-5 accent-[#8ea2ff] ${focusRing}`} />
          {t.consent.agree}
        </label>
      </div>
      <button
        type="button"
        disabled={!agree || pending}
        onClick={submit}
        className={`mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-ink shadow-[0_0_30px_-4px_rgba(180,195,255,0.45)] transition hover:brightness-110 disabled:opacity-50 sm:w-auto sm:px-10 ${focusRing}`}
      >
        {pending ? t.loading : t.consent.cta}
      </button>
    </section>
  );
}

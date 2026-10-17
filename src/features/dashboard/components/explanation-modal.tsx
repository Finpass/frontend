"use client";

import { useEffect, useRef } from "react";
import { fmt } from "@/features/profile/i18n";
import { useProfileLang } from "@/features/profile/state/use-lang";
import type { Explanation } from "@/features/profile/types";
import { CloseIcon } from "./icons";
import { focusRing } from "./ui";

/** Popup with the full text of the assessment explanation, and nothing else. */
export function ExplanationModal({ explanation, onClose }: { explanation: Explanation | null | undefined; onClose: () => void }) {
  const { t } = useProfileLang();
  const r = t.result;
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  const parts = explanation
    ? ([[r.sSummary, explanation.summary], [r.sRisk, explanation.risk], [r.sLadder, explanation.ladder], [r.sHealth, explanation.health], [r.sNext, explanation.nextStep]] as const)
    : [];
  return (
    <dialog
      ref={ref}
      aria-label={r.explanation}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto max-h-[85vh] w-[94vw] overflow-y-auto overscroll-contain rounded-2xl border border-stroke bg-surface p-6 font-app text-ink backdrop:bg-black/70 sm:w-[min(90vw,40rem)] sm:p-7"
    >
      <button type="button" onClick={onClose} aria-label={r.close} className={`absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-ink/70 hover:bg-card hover:text-ink ${focusRing}`}>
        <CloseIcon className="size-5" />
      </button>
      <h2 className="pr-10 text-xl font-bold">{r.explanation}</h2>
      {explanation ? (
        <>
          <div className="mt-5 space-y-5">
            {parts.map(([title, body]) => body && (
              <section key={title}>
                <h3 className="text-sm font-semibold text-accent">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/90">{body}</p>
              </section>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink/60">{fmt(r.sourceLabel, { source: explanation.source })}</p>
          <p className="mt-1 text-xs text-ink/70">{explanation.disclaimer}</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink/70">{r.noExplanation}</p>
      )}
    </dialog>
  );
}

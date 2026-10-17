"use client";

import { useEffect, useRef } from "react";
import { useProfileLang } from "@/features/profile/state/use-lang";
import type { CanRetake, Result } from "@/features/profile/types";
import { focusRing } from "./common";
import { ResultView } from "./result-view";

export function SummaryModal({
  result, canRetake, onRetake, onDelete, onClose, compact,
}: {
  result: Result; canRetake: CanRetake; onRetake: () => Promise<void>; onDelete: () => Promise<void>;
  onClose: () => void; compact?: boolean;
}) {
  const { t } = useProfileLang();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={t.result.title}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto max-h-[90vh] w-[94vw] sm:w-[75vw] overflow-y-auto overscroll-contain rounded-2xl border border-stroke bg-surface p-5 font-app text-ink backdrop:bg-black/70 sm:p-7"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t.result.close}
        className={`absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-ink/70 hover:bg-card hover:text-ink ${focusRing}`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <ResultView result={result} canRetake={canRetake} onRetake={onRetake} onDelete={onDelete} hideDashboardLink={compact} />
    </dialog>
  );
}

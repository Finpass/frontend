"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useProfileLang } from "@/features/profile/state/use-lang";

export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-surface motion-reduce:animate-none ${className}`} />;
}

export function PageSkeleton() {
  const { t } = useProfileLang();
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">{t.loading}</span>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useProfileLang();
  return (
    <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
      <p className="text-sm text-red-200">{message}</p>
      <button onClick={onRetry} className={`mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink ${focusRing}`}>
        {t.retry}
      </button>
    </div>
  );
}

export function LangToggle() {
  const { lang, setLang, t } = useProfileLang();
  return (
    <div role="group" aria-label={t.langLabel} className="flex rounded-full border border-stroke p-0.5 text-xs font-semibold">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1 uppercase ${focusRing} ${lang === l ? "bg-accent text-primary-ink" : "text-ink/70 hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Native <dialog> gives focus trapping, Escape and inert background for free. */
export function ConfirmDialog({
  title, body, confirm, cancel, pending, onConfirm, onCancel, children,
}: {
  title: string; body: string; confirm: string; cancel: string; pending?: boolean;
  onConfirm: () => void; onCancel: () => void; children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-stroke bg-surface p-6 font-app text-ink backdrop:bg-black/70"
    >
      <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
      <p id="confirm-body" className="mt-2 text-sm text-ink/70">{body}</p>
      {children}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" autoFocus onClick={onCancel} className={`rounded-xl border border-stroke px-4 py-2 text-sm font-semibold ${focusRing}`}>{cancel}</button>
        <button type="button" disabled={pending} onClick={onConfirm} className={`rounded-xl bg-red-400 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60 ${focusRing}`}>{confirm}</button>
      </div>
    </dialog>
  );
}

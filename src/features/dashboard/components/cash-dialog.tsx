"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { toApiError, userMessage } from "@/lib/api-error";
import { profileApi } from "@/features/profile/api/profile-api";
import { useDash } from "@/features/dashboard/state/use-dash";
import { focusRing } from "./ui";

const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const MAX = 100_000_000_000_000; // matches a sane upper bound for a self-reported savings figure

/** Edits the liquid savings answer of the profile, so Home and Portfolio always show the same cash. */
export function CashDialog({ amount, onClose, onSaved }: { amount: number; onClose: () => void; onSaved: () => void }) {
  const { t } = useDash();
  const c = t.cash;
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const [raw, setRaw] = useState(amount.toLocaleString("id-ID"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = digits(raw);
    if (n > MAX) return setError(c.tooLarge);
    setSaving(true);
    setError("");
    try {
      await profileApi.updateCash(n);
      toast.success(c.saved);
      onSaved();
      onClose();
    } catch (err) {
      setError(userMessage(toApiError(err)));
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-t`}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-stroke bg-surface p-6 font-app text-ink backdrop:bg-black/70"
    >
      <form onSubmit={submit}>
        <h2 id={`${uid}-t`} className="text-lg font-bold">{c.title}</h2>
        <p className="mt-1 text-sm text-ink/70">{c.body}</p>
        <label htmlFor={`${uid}-a`} className="mt-5 block text-sm font-medium">{c.label}</label>
        <div className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border border-stroke bg-field px-4 focus-within:ring-2 focus-within:ring-accent/70">
          <span className="text-ink/60">Rp</span>
          <input id={`${uid}-a`} autoFocus inputMode="numeric" value={raw} aria-invalid={Boolean(error)} onChange={(e) => setRaw(digits(e.target.value) ? digits(e.target.value).toLocaleString("id-ID") : "")} className="min-w-0 flex-1 bg-transparent font-semibold outline-none" />
        </div>
        <p className="mt-2 text-xs text-ink/60">{c.note}</p>
        {error && <p role="alert" className="mt-3 text-sm text-loss">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className={`rounded-xl border border-stroke px-4 py-2 text-sm font-semibold ${focusRing}`}>{c.cancel}</button>
          <button type="submit" disabled={saving} className={`rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink disabled:opacity-60 ${focusRing}`}>{saving ? c.saving : c.save}</button>
        </div>
      </form>
    </dialog>
  );
}

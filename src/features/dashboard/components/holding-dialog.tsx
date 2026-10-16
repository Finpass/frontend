"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { toApiError, userMessage } from "@/lib/api-error";
import { holdingsApi } from "@/features/dashboard/api/dashboard-api";
import { MANUAL_CLASSES, validateHolding, type Errors, type Field, type FormInput, type FormMode } from "@/features/dashboard/lib/holding-form";
import { idr, shortDate, todayJakarta } from "@/features/dashboard/lib/format";
import { useDash, useDebounced, useResource } from "@/features/dashboard/state/use-dash";
import type { Holding } from "@/features/dashboard/types";
import { focusRing } from "./ui";

const input = `h-11 w-full rounded-xl border bg-field px-3 text-sm placeholder:text-ink/40 ${focusRing}`;

const blank = (mode: FormMode): FormInput => ({ mode, symbol: "", name: "", assetClass: "", currentPrice: "", units: "", avgCost: "", acquiredAt: "", isManual: false });

const fromHolding = (h: Holding): FormInput => ({
  mode: "edit",
  symbol: h.symbol ?? "",
  name: h.name,
  assetClass: h.assetClass,
  currentPrice: String(Math.round(h.lastPrice)),
  units: String(h.units).replace(".", ","),
  avgCost: String(Math.round(h.avgCost)),
  acquiredAt: h.acquiredAt.slice(0, 10),
  isManual: h.isManual,
});

/** Add or edit a holding. Native <dialog> gives focus trapping, Escape and an inert background. */
export function HoldingDialog({ holding, onClose, onSaved }: { holding: Holding | null; onClose: () => void; onSaved: () => void }) {
  const { lang, t } = useDash();
  const h = t.hd;
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState<FormInput>(() => (holding ? fromHolding(holding) : blank("search")));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<{ symbol: string; name: string; sub: string } | null>(null);
  const editing = holding !== null;
  const uid = useId();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const set = (k: keyof FormInput) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const mode = (m: FormMode) => {
    setF((p) => ({ ...blank(m), units: p.units, avgCost: p.avgCost, acquiredAt: p.acquiredAt }));
    setPicked(null);
    setErrors({});
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const v = validateHolding(f, todayJakarta());
    if (!v.ok) {
      setErrors(v.errors);
      ref.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (holding && v.update) await holdingsApi.update(holding.id, v.update);
      else if (v.create) await holdingsApi.create(v.create);
      toast.success(h.saved);
      onSaved();
      onClose();
    } catch (err) {
      const api = toApiError(err);
      const fe = api.fieldErrors();
      const map: Record<string, Field> = { symbol: "instrument", "manual.name": "name", "manual.assetClass": "assetClass", "manual.currentPrice": "currentPrice", currentPrice: "currentPrice", units: "units", avgCost: "avgCost", acquiredAt: "acquiredAt" };
      const server: Errors = {};
      for (const k of Object.keys(fe)) if (map[k]) server[map[k]] = "invalid";
      if (Object.keys(server).length) setErrors(server);
      setFormError(Object.values(fe)[0] ?? userMessage(api));
    } finally {
      setSaving(false);
    }
  };

  const err = (k: Field) => (errors[k] ? h.err[errors[k] as keyof typeof h.err] : null);
  const field = (k: Field, label: string, children: (p: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`${uid}-${k}`} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children({ id: `${uid}-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${uid}-${k}-e` : hint ? `${uid}-${k}-h` : undefined })}
      {hint && !errors[k] && <p id={`${uid}-${k}-h`} className="mt-1 text-xs text-ink/60">{hint}</p>}
      {errors[k] && <p id={`${uid}-${k}-e`} role="alert" className="mt-1 text-xs text-loss">{err(k)}</p>}
    </div>
  );
  const cls = (k: Field) => `${input} ${errors[k] ? "border-loss" : "border-stroke"}`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-title`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(94vw,32rem)] overflow-y-auto rounded-2xl border border-stroke bg-surface p-5 font-app text-ink backdrop:bg-black/70 sm:p-6"
    >
      <h2 id={`${uid}-title`} className="text-lg font-bold">{editing ? h.editTitle : h.addTitle}</h2>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        {!editing && (
          <div role="group" aria-label={h.modeLabel} className="grid grid-cols-2 gap-1 rounded-xl border border-stroke bg-field p-0.5 text-sm">
            {(["search", "manual"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={f.mode === m} onClick={() => mode(m)} className={`rounded-lg px-3 py-2 font-medium ${focusRing} ${f.mode === m ? "bg-accent text-primary-ink" : "text-ink/70"}`}>
                {m === "search" ? h.search : h.manual}
              </button>
            ))}
          </div>
        )}

        {f.mode === "search" && !editing && (
          <Search label={h.symbol} error={err("instrument")} picked={picked} onPick={(a) => { setPicked({ symbol: a.symbol, name: a.name, sub: `${a.exchange} ${idr(a.lastPrice)}${a.lastTradeDate ? `, ${shortDate(a.lastTradeDate, lang)}` : ""}` }); set("symbol")(a.symbol); }} onClear={() => { setPicked(null); set("symbol")(""); }} id={`${uid}-instrument`} />
        )}

        {f.mode === "manual" && (
          <>
            <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs text-ink/80">{h.manualNote}</p>
            {field("name", h.name, (p) => <input {...p} value={f.name} onChange={(e) => set("name")(e.target.value)} className={cls("name")} autoComplete="off" />)}
            {field("assetClass", h.assetClass, (p) => (
              <select {...p} value={f.assetClass} onChange={(e) => set("assetClass")(e.target.value)} className={cls("assetClass")}>
                <option value="">{h.choose}</option>
                {MANUAL_CLASSES.map((c) => <option key={c} value={c}>{h.classes[c]}</option>)}
              </select>
            ))}
          </>
        )}

        {editing && (
          <p className="rounded-xl border border-stroke bg-field px-3 py-2 text-sm"><b>{holding.symbol ?? holding.name}</b> <span className="text-ink/60">{holding.symbol ? holding.name : ""}</span></p>
        )}

        {(f.mode === "manual" || (editing && holding?.isManual)) &&
          field("currentPrice", h.currentPrice, (p) => <input {...p} inputMode="decimal" value={f.currentPrice} onChange={(e) => set("currentPrice")(e.target.value)} className={cls("currentPrice")} autoComplete="off" />, h.hint)}

        <div className="grid gap-4 sm:grid-cols-2">
          {field("units", h.units, (p) => <input {...p} inputMode="decimal" value={f.units} onChange={(e) => set("units")(e.target.value)} className={cls("units")} autoComplete="off" />)}
          {field("avgCost", h.avgCost, (p) => <input {...p} inputMode="decimal" value={f.avgCost} onChange={(e) => set("avgCost")(e.target.value)} className={cls("avgCost")} autoComplete="off" />)}
        </div>
        {field("acquiredAt", h.acquiredAt, (p) => <input {...p} type="date" max={todayJakarta()} value={f.acquiredAt} onChange={(e) => set("acquiredAt")(e.target.value)} className={cls("acquiredAt")} />)}

        {formError && <p role="alert" className="rounded-xl bg-loss/10 px-3 py-2 text-sm text-loss">{formError}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={`rounded-xl border border-stroke px-4 py-2 text-sm font-semibold ${focusRing}`}>{h.cancel}</button>
          <button type="submit" disabled={saving} className={`rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-ink disabled:opacity-60 ${focusRing}`}>{saving ? h.saving : h.save}</button>
        </div>
      </form>
    </dialog>
  );
}

function Search({ id, label, error, picked, onPick, onClear }: {
  id: string; label: string; error: string | null;
  picked: { symbol: string; name: string; sub: string } | null;
  onPick: (a: { symbol: string; name: string; exchange: string; lastPrice: number; lastTradeDate: string }) => void;
  onClear: () => void;
}) {
  const { t } = useDash();
  const h = t.hd;
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 300);
  const res = useResource(`assets:${dq}`, (signal) => (dq ? holdingsApi.searchAssets(dq, 8, { signal }) : Promise.resolve([])));
  const busy = !!dq && (res.loading || dq !== q.trim());

  if (picked) {
    return (
      <div>
        <p className="mb-1.5 text-sm font-medium">{h.selected}</p>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2">
          <div className="min-w-0 text-sm"><b>{picked.symbol}</b> <span className="text-ink/70">{picked.name}</span><p className="truncate text-xs text-ink/60">{picked.sub}</p></div>
          <button type="button" onClick={onClear} className={`rounded-lg px-2 py-1 text-sm text-accent ${focusRing}`}>{h.change}</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={h.symbolPlaceholder} autoComplete="off" aria-invalid={!!error} aria-describedby={`${id}-s`} className={`${input} ${error ? "border-loss" : "border-stroke"}`} />
      <div id={`${id}-s`} aria-live="polite" className="mt-2 text-xs text-ink/70">
        {error && <p role="alert" className="mb-1 text-loss">{error}</p>}
        {busy && h.searching}
        {!busy && dq && res.error && h.searchError}
        {!busy && dq && !res.error && res.data?.length === 0 && h.noResults}
      </div>
      {!busy && !!res.data?.length && dq && (
        <ul aria-label={h.results} className="mt-1 max-h-52 divide-y divide-stroke overflow-y-auto rounded-xl border border-stroke">
          {res.data.map((a) => (
            <li key={a.symbol}>
              <button type="button" onClick={() => onPick(a)} className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-field ${focusRing}`}>
                <span className="min-w-0"><b>{a.symbol}</b> <span className="text-ink/70">{a.name}</span></span>
                <span className="shrink-0 text-xs text-ink/60">{a.exchange}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

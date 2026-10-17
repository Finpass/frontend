"use client";

import { useId, useState } from "react";
import toast from "react-hot-toast";
import { toApiError, userMessage } from "@/lib/api-error";
import { LangToggle } from "@/features/profile/components/common";
import { whatsappApi } from "@/features/dashboard/api/dashboard-api";
import { shortDate } from "@/features/dashboard/lib/format";
import { useDash, useResource } from "@/features/dashboard/state/use-dash";
import type { BriefingPreview, WhatsappSettings } from "@/features/dashboard/types";
import { ProfileSettings } from "./profile-settings";
import { InlineError, LoadingRegion, PageTitle, Sk, card, focusRing, selectArrow, selectChevron } from "./ui";

const TIMEZONES = [
  { id: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { id: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { id: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
];

const selectField = `h-11 w-full rounded-xl border border-stroke bg-field pl-3 text-sm ${selectArrow} ${focusRing}`;

const field = `h-11 w-full rounded-xl border border-stroke bg-field px-3 text-sm ${focusRing}`;

export function SettingsView() {
  const { t } = useDash();
  const res = useResource("whatsapp", () => whatsappApi.get());
  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <PageTitle title={t.settings.title} sub={t.settings.sub} />
      <section aria-labelledby="lang-title" className={`${card} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
        <div>
          <h2 id="lang-title" className="text-lg font-bold">{t.settings.langTitle}</h2>
          <p className="text-sm text-ink/70">{t.settings.langBody}</p>
        </div>
        <LangToggle />
      </section>
      <ProfileSettings />
      <section aria-labelledby="wa-title" className={`${card} p-5 sm:p-6`}>
        <h2 id="wa-title" className="text-lg font-bold">{t.settings.waTitle}</h2>
        <p className="mt-1 text-sm text-ink/70">{t.settings.waBody}</p>
        <div className="mt-5">
          {!res.data && res.error && <InlineError message={userMessage(res.error)} onRetry={res.reload} />}
          {!res.data && !res.error && <LoadingRegion label={t.loading}><Sk className="h-48" /></LoadingRegion>}
          {res.data && <WaForm key={`${res.data.phone}|${res.data.verified}|${res.data.optIn}|${res.data.sendTimeLocal}|${res.data.frequency}|${res.data.timezone}|${res.data.language}`} initial={res.data} onChanged={res.reload} />}
        </div>
      </section>
    </div>
  );
}

function WaForm({ initial, onChanged }: { initial: WhatsappSettings; onChanged: () => void }) {
  const { lang, t } = useDash();
  const s = t.settings;
  const uid = useId();
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [optIn, setOptIn] = useState(initial.optIn);
  const [time, setTime] = useState(initial.sendTimeLocal || "07:00");
  const [freq, setFreq] = useState<string>(initial.frequency || "daily");
  const [tz, setTz] = useState(initial.timezone || "Asia/Jakarta");
  const [wl, setWl] = useState<"id" | "en">(initial.language || lang);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "start" | "confirm" | "test" | "preview">("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<BriefingPreview | null>(null);

  const dirty = phone.trim() !== (initial.phone ?? "") || optIn !== initial.optIn || time !== (initial.sendTimeLocal || "07:00")
    || freq !== (initial.frequency || "daily") || tz !== (initial.timezone || "Asia/Jakarta") || wl !== (initial.language || lang);
  const run = async (k: typeof busy, fn: () => Promise<void>, ok?: string) => {
    setBusy(k);
    setMsg(null);
    try {
      await fn();
      if (ok) {
        setMsg({ kind: "ok", text: ok });
        toast.success(ok);
      }
    } catch (e) {
      const api = toApiError(e);
      setMsg({ kind: "err", text: api.fieldErrors().phone ?? userMessage(api) });
    } finally {
      setBusy("");
    }
  };

  const save = () => {
    if (!phone.trim()) return setMsg({ kind: "err", text: s.phoneRequired });
    void run("save", async () => {
      await whatsappApi.save({ phone: phone.trim(), optIn, sendTimeLocal: time, frequency: freq, timezone: tz, language: wl });
      onChanged();
    }, s.saved);
  };
  const start = () => void run("start", async () => { await whatsappApi.verifyStart(); setCodeOpen(true); }, s.codeSent);
  const confirm = () => {
    if (!/^\d{6}$/.test(code)) return setMsg({ kind: "err", text: s.codeInvalid });
    void run("confirm", async () => { await whatsappApi.verifyConfirm(code); setCodeOpen(false); setCode(""); onChanged(); }, s.verifiedOk);
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${uid}-phone`} className="mb-1.5 block text-sm font-medium">{s.phone}</label>
        <div className="flex flex-wrap items-center gap-3">
          <input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-describedby={`${uid}-ph`} className={`${field} max-w-xs`} />
          {initial.phone && (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${initial.verified ? "border-gain/50 text-gain" : "border-warn/50 text-warn"}`}>{initial.verified ? s.verified : s.notVerified}</span>
          )}
        </div>
        <p id={`${uid}-ph`} className="mt-1 text-xs text-ink/60">{s.phoneHint}</p>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className={`size-5 accent-[var(--color-accent)] ${focusRing}`} />
        {s.optIn}
      </label>

      <div>
        <label htmlFor={`${uid}-time`} className="mb-1.5 block text-sm font-medium">{s.sendTime}</label>
        <div className="flex flex-wrap gap-3">
          <div className="w-40"><input id={`${uid}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} /></div>
          <div className="min-w-52 flex-1 sm:max-w-xs"><select aria-label={s.timezoneLabel} value={tz} onChange={(e) => setTz(e.target.value)} className={selectField} style={{ backgroundImage: selectChevron }}>
            {TIMEZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            {!TIMEZONES.some((z) => z.id === tz) && <option value={tz}>{tz}</option>}
          </select></div>
        </div>
        <p className="mt-1 text-xs text-ink/60">{s.timezone.replace("{tz}", tz)}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-freq`} className="mb-1.5 block text-sm font-medium">{s.frequency}</label>
          <select id={`${uid}-freq`} value={freq} onChange={(e) => setFreq(e.target.value)} className={selectField} style={{ backgroundImage: selectChevron }}>
            <option value="daily">{s.freqDaily}</option>
            <option value="weekdays">{s.freqWeekdays}</option>
            <option value="weekly">{s.freqWeekly}</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-wl`} className="mb-1.5 block text-sm font-medium">{s.briefLang}</label>
          <select id={`${uid}-wl`} value={wl} onChange={(e) => setWl(e.target.value as "id" | "en")} aria-describedby={`${uid}-wlh`} className={selectField} style={{ backgroundImage: selectChevron }}>
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
          <p id={`${uid}-wlh`} className="mt-1 text-xs text-ink/60">{s.briefLangHint}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy !== "" || !dirty} onClick={save} className={`rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink disabled:opacity-50 ${focusRing}`}>{busy === "save" ? s.saving : s.save}</button>
        {initial.phone && !initial.verified && !dirty && (
          <button type="button" disabled={busy !== ""} onClick={start} className={`rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${focusRing}`}>{s.verifyStart}</button>
        )}
        {initial.verified && !dirty && (
          <button type="button" disabled={busy !== ""} onClick={() => run("test", async () => void (await whatsappApi.sendTest()), s.testSent)} className={`rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${focusRing}`}>{s.sendTest}</button>
        )}
      </div>

      {codeOpen && !initial.verified && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stroke bg-paper/60 p-4">
          <div>
            <label htmlFor={`${uid}-code`} className="mb-1.5 block text-sm font-medium">{s.code}</label>
            <input id={`${uid}-code`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${field} w-40 tracking-[0.4em]`} />
          </div>
          <button type="button" disabled={busy !== ""} onClick={confirm} className={`rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink disabled:opacity-50 ${focusRing}`}>{s.verifyConfirm}</button>
        </div>
      )}

      <p role={msg?.kind === "err" ? "alert" : "status"} aria-live="polite" className={`min-h-5 text-sm ${msg?.kind === "err" ? "text-loss" : "text-gain"}`}>{msg?.text}</p>

      <div className="border-t border-stroke pt-4 text-sm text-ink/70">
        <p>{s.lastSent.replace("{when}", initial.lastSentAt ? shortDate(initial.lastSentAt, lang) : s.never)}</p>
        {initial.verified && (
          <div className="mt-3">
            <button
              type="button"
              disabled={busy !== ""}
              onClick={() => run("preview", async () => setPreview(await whatsappApi.preview(initial.language || lang)))}
              className={`rounded-xl border border-stroke px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 ${focusRing}`}
            >
              {busy === "preview" ? s.previewLoading : s.preview}
            </button>
            {preview && (
              <div className="mt-3 rounded-xl border border-stroke bg-paper/60 p-4">
                <pre className="whitespace-pre-wrap font-app text-sm text-ink/90">{preview.text}</pre>
                <p className="mt-2 text-xs text-ink/60">{s.previewChars.replace("{n}", String(preview.charCount))}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

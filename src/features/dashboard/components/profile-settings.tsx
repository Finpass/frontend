"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { toApiError } from "@/lib/api-error";
import { notifyError } from "@/lib/notify-error";
import { useAuth } from "@/features/auth/state/auth-context";
import { profileApi } from "@/features/profile/api/profile-api";
import { ConfirmDialog } from "@/features/profile/components/common";
import { fmt } from "@/features/profile/i18n";
import { useProfileLang } from "@/features/profile/state/use-lang";
import { useDash, useResource } from "@/features/dashboard/state/use-dash";
import { Sk, card, focusRing } from "./ui";

/** Retake the assessment or erase the profile data. These moved here from the result page. */
export function ProfileSettings() {
  const { lang, t } = useProfileLang();
  const { t: d } = useDash();
  const r = t.result;
  const router = useRouter();
  const { user } = useAuth();
  const prof = useResource(`profile:${user?.id ?? ""}`, () => profileApi.get());
  const [busy, setBusy] = useState<"retake" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const p = prof.data;
  const can = p?.canRetake;
  const completed = p?.status === "completed";
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  const run = async (kind: "retake" | "delete") => {
    setBusy(kind);
    try {
      await (kind === "retake" ? profileApi.retake() : profileApi.remove());
      if (kind === "delete") toast.success(r.deleted);
      router.push("/onboarding");
    } catch (e) {
      if (toApiError(e).status === 409) toast.error(fmt(t.err.cooldown, { date: can?.nextAllowedAt ? date(can.nextAllowedAt) : "-" }));
      else notifyError(e);
      setBusy(null);
      setConfirming(false);
    }
  };

  return (
    <section aria-labelledby="prof-title" className={`${card} p-5 sm:p-6`}>
      <h2 id="prof-title" className="text-lg font-bold">{d.settings.profileTitle}</h2>
      <p className="mt-1 text-sm text-ink/70">{d.settings.profileBody}</p>
      {!p ? (
        <Sk className="mt-5 h-20" />
      ) : !completed ? (
        <p className="mt-5 text-sm text-ink/70">{d.settings.profileNone}</p>
      ) : (
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div>
            <button type="button" disabled={busy !== null || !can?.allowed} onClick={() => run("retake")} className={`h-11 rounded-xl border border-stroke px-5 text-sm font-semibold disabled:opacity-50 ${focusRing}`}>
              {busy === "retake" ? r.retaking : r.retake}
            </button>
            {can && <p className="mt-1.5 text-xs text-ink/70">{!can.allowed && can.nextAllowedAt ? fmt(r.retakeLocked, { date: date(can.nextAllowedAt) }) : fmt(r.retakeLeft, { n: can.remainingThisYear })}</p>}
          </div>
          <button type="button" onClick={() => setConfirming(true)} className={`h-11 rounded-xl border border-loss/40 px-5 text-sm font-semibold text-loss hover:bg-loss/10 sm:ml-auto ${focusRing}`}>{r.del}</button>
        </div>
      )}
      {confirming && (
        <ConfirmDialog title={r.delTitle} body={r.delBody} confirm={busy === "delete" ? r.deleting : r.delConfirm} cancel={r.delCancel} pending={busy === "delete"} onConfirm={() => run("delete")} onCancel={() => setConfirming(false)} />
      )}
    </section>
  );
}

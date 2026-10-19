"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { notifyError } from "@/lib/notify-error";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuth } from "@/features/auth/state/auth-context";
import { useDash } from "@/features/dashboard/state/use-dash";
import { card, focusRing } from "./ui";

const field = `h-11 w-full rounded-xl border border-stroke bg-field px-3 text-sm ${focusRing}`;

/** Data-subject rights (UU PDP): a downloadable copy of the data, and permanent account deletion. */
export function PrivacySettings() {
  const { t } = useDash();
  const s = t.settings;
  const router = useRouter();
  const { signOut } = useAuth();
  const uid = useId();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");

  const download = async () => {
    setBusy("export");
    try {
      const data = await authApi.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: "finpass-data.json" });
      a.click();
      URL.revokeObjectURL(url);
      toast.success(s.exported);
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await authApi.deleteAccount(password);
      toast.success(s.delDone);
      await signOut(); // the server session is already gone; this clears the local one
      router.replace("/");
    } catch (e) {
      notifyError(e);
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="privacy-title" className={`${card} p-5 sm:p-6`}>
      <h2 id="privacy-title" className="text-lg font-bold">{s.privacyTitle}</h2>
      <p className="mt-1 text-sm text-ink/70">{s.privacyBody}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={download} disabled={busy !== null} className={`h-11 rounded-xl border border-stroke px-4 text-sm font-semibold disabled:opacity-60 ${focusRing}`}>
          {busy === "export" ? s.exporting : s.exportBtn}
        </button>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className={`h-11 rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-600 ${focusRing}`}>
            {s.delOpen}
          </button>
        )}
      </div>
      {open && (
        <form
          className="mt-5 space-y-3 rounded-xl border border-red-200 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void remove();
          }}
        >
          <p className="text-sm text-red-600">{s.delWarn}</p>
          <div>
            <label htmlFor={`${uid}-pw`} className="text-sm font-medium">{s.delPassword}</label>
            <input id={`${uid}-pw`} type="password" autoComplete="current-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1 ${field}`} />
            <p className="mt-1 text-xs text-ink/60">{s.delPasswordHint}</p>
          </div>
          <div>
            <label htmlFor={`${uid}-ty`} className="text-sm font-medium">{s.delType}</label>
            <input id={`${uid}-ty`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={`mt-1 ${field}`} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={typed !== "DELETE" || busy !== null} className={`h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50 ${focusRing}`}>
              {busy === "delete" ? s.delBusy : s.delBtn}
            </button>
            <button type="button" onClick={() => { setOpen(false); setPassword(""); setTyped(""); }} disabled={busy !== null} className={`h-11 rounded-xl border border-stroke px-4 text-sm font-semibold ${focusRing}`}>
              {s.delCancel}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

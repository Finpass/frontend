"use client";

import { useEffect } from "react";
import { GOOGLE_CLIENT_ID, loadGoogle, requestGoogleAccessToken } from "@/features/auth/lib/google";
import { authApi } from "@/features/auth/api/auth-api";
import { useAction } from "@/features/auth/hooks/use-action";
import type { Session } from "@/features/auth/types";
import { FormError } from "./fields";
import { GoogleIcon } from "./icons";

const socialClass =
  "flex h-14 items-center justify-center gap-3 rounded-xl bg-field/70 text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";

export function SocialRow({ onSession }: { onSession: (s: Session) => void }) {
  const { pending, error, setError, run } = useAction();
  const enabled = GOOGLE_CLIENT_ID !== "";

  useEffect(() => {
    if (enabled) loadGoogle().catch(() => undefined);
  }, [enabled]);

  const signIn = async () => {
    // token must be requested synchronously from the click, so only the API call is awaited
    let token: string;
    try {
      token = await requestGoogleAccessToken();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
      return;
    }
    const session = await run(() => authApi.google(token));
    if (session) onSession(session);
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={signIn} disabled={!enabled || pending} title={enabled ? undefined : "Google sign-in is not configured"} className={`${socialClass} w-full`}>
        <GoogleIcon className="h-5 w-5" /> Continue with Google
      </button>
      <FormError message={error} />
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-ink/50">
      <span className="h-px flex-1 bg-ink/10" />
      {label}
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  );
}

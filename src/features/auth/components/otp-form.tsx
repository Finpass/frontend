"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/features/auth/api/auth-api";
import { useAction } from "@/features/auth/hooks/use-action";
import type { AuthView, Session } from "@/features/auth/types";
import { validateCode } from "@/features/auth/validation";
import { FormError, PrimaryButton } from "./fields";
import { OtpInput } from "./otp-input";

const COOLDOWN_SECONDS = 60;

export function OtpForm({ email, onSession, onSwitch }: { email: string; onSession: (s: Session) => void; onSwitch: (v: AuthView) => void }) {
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(COOLDOWN_SECONDS);
  const { pending, error, run } = useAction();
  const resend = useAction();

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const verify = async (value: string) => {
    if (validateCode(value)) return;
    const session = await run(() => authApi.verifyEmail(email, value));
    if (session) onSession(session);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void verify(code);
  };

  const sendAgain = async () => {
    const ok = await resend.run(() => authApi.resendOtp(email).then(() => true));
    if (ok) {
      setLeft(COOLDOWN_SECONDS);
      toast.success("A new code was sent if the account exists");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <OtpInput
        value={code}
        disabled={pending}
        onChange={(v) => {
          setCode(v);
          if (v.length === 6) void verify(v);
        }}
      />
      <FormError message={error || resend.error} />
      <PrimaryButton pending={pending} disabled={pending || code.length < 6}>
        Verify email
      </PrimaryButton>
      <p className="text-center text-sm text-ink/70">
        Did not get it?{" "}
        <button type="button" disabled={left > 0 || resend.pending} onClick={sendAgain} className="font-semibold text-primary enabled:hover:underline disabled:opacity-50">
          {left > 0 ? `Resend in ${left}s` : "Resend code"}
        </button>
      </p>
      <p className="text-center text-sm">
        <button type="button" onClick={() => onSwitch("login")} className="text-ink/60 hover:text-ink">
          Back to sign in
        </button>
      </p>
    </form>
  );
}

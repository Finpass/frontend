"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/features/auth/api/auth-api";
import { useAction } from "@/features/auth/hooks/use-action";
import type { AuthView } from "@/features/auth/types";
import { validateCode, validateEmail, validatePassword } from "@/features/auth/validation";
import { Field, FormError, PrimaryButton } from "./fields";
import { ArrowIcon, LockIcon, MailIcon } from "./icons";
import { OtpInput } from "./otp-input";

export function ForgotForm({ onSwitch, onStep }: { onSwitch: (v: AuthView) => void; onStep: (step: "request" | "reset") => void }) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", code: "", password: "" });
  const { pending, error, run } = useAction();

  const request = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validateEmail(email);
    setErrors((x) => ({ ...x, email: invalid }));
    if (invalid) return;
    const ok = await run(() => authApi.forgotPassword(email.trim()).then(() => true));
    if (ok) {
      setStep("reset");
      onStep("reset");
    }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: "", code: validateCode(code), password: validatePassword(password) };
    setErrors(next);
    if (next.code || next.password) return;
    const ok = await run(() => authApi.resetPassword({ email: email.trim(), code, newPassword: password }).then(() => true));
    if (ok) {
      toast.success("Password updated. Sign in with your new password.");
      onSwitch("login");
    }
  };

  return (
    <>
      {step === "request" ? (
        <form onSubmit={request} noValidate className="space-y-5">
          <Field label="Email address" icon={<MailIcon />} type="email" autoComplete="email" placeholder="name@email.com" value={email} onChange={setEmail} error={errors.email} />
          <FormError message={error} />
          <PrimaryButton pending={pending}>
            Send reset code <ArrowIcon className="h-5 w-5" />
          </PrimaryButton>
        </form>
      ) : (
        <form onSubmit={reset} noValidate className="space-y-5">
          <div>
            <p className="mb-2 text-sm text-ink/80">6-digit code sent to {email.trim()}</p>
            <OtpInput value={code} onChange={setCode} disabled={pending} />
            {errors.code && <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.code}</p>}
          </div>
          <Field label="New password" icon={<LockIcon />} type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={setPassword} error={errors.password} />
          <FormError message={error} />
          <PrimaryButton pending={pending}>Update password</PrimaryButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <button type="button" onClick={() => onSwitch("login")} className="text-ink/60 hover:text-ink">
          Back to sign in
        </button>
      </p>
    </>
  );
}

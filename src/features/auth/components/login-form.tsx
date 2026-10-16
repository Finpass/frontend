"use client";

import { useState, type FormEvent } from "react";
import { authApi } from "@/features/auth/api/auth-api";
import { useAction } from "@/features/auth/hooks/use-action";
import type { AuthView, Session } from "@/features/auth/types";
import { validateEmail } from "@/features/auth/validation";
import { Field, FormError, PrimaryButton } from "./fields";
import { ArrowIcon, LockIcon, MailIcon } from "./icons";
import { Divider, SocialRow } from "./social-row";

interface Props {
  onSession: (s: Session) => void;
  onSwitch: (v: AuthView) => void;
  onNeedVerify: (email: string) => void;
}

export function LoginForm({ onSession, onSwitch, onNeedVerify }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const { pending, error, run } = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validateEmail(email);
    setEmailError(invalid);
    if (invalid || !password) return;
    const session = await run(
      () => authApi.login({ email: email.trim(), password }),
      (err) => {
        const unverified = err.code === "FORBIDDEN" && err.details.some((d) => d.message === "not_verified");
        if (unverified) onNeedVerify(email.trim());
        return unverified;
      },
    );
    if (session) onSession(session);
  };

  return (
    <>
      <SocialRow onSession={onSession} />
      <Divider label="Or sign in with email" />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email address" icon={<MailIcon />} type="email" autoComplete="email" placeholder="name@email.com" value={email} onChange={setEmail} error={emailError} />
        <Field
          label="Password"
          icon={<LockIcon />}
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={setPassword}
          labelAside={
            <button type="button" onClick={() => onSwitch("forgot")} className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </button>
          }
        />
        <FormError message={error} />
        <PrimaryButton pending={pending}>
          Sign in to Workspace <ArrowIcon className="h-5 w-5" />
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-ink/70">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={() => onSwitch("register")} className="font-semibold text-primary hover:underline">
          Create account
        </button>
      </p>
    </>
  );
}

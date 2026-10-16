"use client";

import { useState, type FormEvent } from "react";
import { authApi } from "@/features/auth/api/auth-api";
import { useAction } from "@/features/auth/hooks/use-action";
import type { AuthView, Session } from "@/features/auth/types";
import { validateEmail, validateName, validatePassword } from "@/features/auth/validation";
import { Field, FormError, PrimaryButton } from "./fields";
import { ArrowIcon, LockIcon, MailIcon, UserIcon } from "./icons";
import { Divider, SocialRow } from "./social-row";

interface Props {
  onSession: (s: Session) => void;
  onSwitch: (v: AuthView) => void;
  onNeedVerify: (email: string) => void;
}

export function RegisterForm({ onSession, onSwitch, onNeedVerify }: Props) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });
  const { pending, error, run } = useAction();
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { name: validateName(form.name), email: validateEmail(form.email), password: validatePassword(form.password) };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    const res = await run(() => authApi.register({ name: form.name.trim(), email: form.email.trim(), password: form.password }));
    if (res) onNeedVerify(res.email);
  };

  return (
    <>
      <SocialRow onSession={onSession} />
      <Divider label="Or sign up with email" />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Full name" icon={<UserIcon />} autoComplete="name" placeholder="Your name" value={form.name} onChange={set("name")} error={errors.name} />
        <Field label="Email address" icon={<MailIcon />} type="email" autoComplete="email" placeholder="name@email.com" value={form.email} onChange={set("email")} error={errors.email} />
        <Field label="Password" icon={<LockIcon />} type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set("password")} error={errors.password} />
        <FormError message={error} />
        <PrimaryButton pending={pending}>
          Create account <ArrowIcon className="h-5 w-5" />
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-ink/70">
        Already have an account?{" "}
        <button type="button" onClick={() => onSwitch("login")} className="font-semibold text-primary hover:underline">
          Sign in
        </button>
      </p>
    </>
  );
}

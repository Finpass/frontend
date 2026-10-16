"use client";

import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  icon: ReactNode;
  error?: string;
  onChange: (value: string) => void;
  labelAside?: ReactNode;
}

export function Field({ label, icon, error, onChange, labelAside, type = "text", ...rest }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-ink/80">{label}</label>
        {labelAside}
      </div>
      <div
        className={`flex h-14 items-center gap-3 rounded-xl bg-field px-4 text-ink/60 ring-1 transition focus-within:ring-2 focus-within:ring-accent/70 ${
          error ? "ring-red-400/70" : "ring-stroke"
        }`}
      >
        <span className="h-5 w-5 shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink/30"
          {...rest}
        />
        {isPassword && (
          <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? "Hide password" : "Show password"} className="text-ink/60 hover:text-ink">
            {shown ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</p>;
}

export function PrimaryButton({ children, pending, ...rest }: { pending?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-ink shadow-[0_0_30px_-4px_rgba(180,195,255,0.45)] transition hover:brightness-110 disabled:opacity-60"
      {...rest}
    >
      {pending ? "Please wait..." : children}
    </button>
  );
}

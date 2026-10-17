"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { focusRing } from "@/features/profile/components/common";
import { pct } from "@/features/dashboard/lib/format";
import { useDash } from "@/features/dashboard/state/use-dash";
import { useDismiss } from "@/features/dashboard/state/use-dismiss";
import { ArrowIcon, BriefcaseIcon, ChevronIcon, UserIcon } from "./icons";

export { focusRing };

export const selectChevron = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a8bd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";
export const selectArrow = "appearance-none bg-[length:16px] bg-[position:right_0.75rem_center] bg-no-repeat pr-9";

export const card = "rounded-2xl border border-stroke bg-card";

export function Delta({ value, suffix, digits = 1 }: { value: number; suffix?: string; digits?: number }) {
  const { lang } = useDash();
  const down = value < 0;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${down ? "text-loss" : "text-gain"}`}>
        <ArrowIcon down={down} />
        {pct(value, lang, { sign: true, digits })}
      </span>
      {suffix && <span className="text-ink/60">{suffix}</span>}
    </span>
  );
}

export const tabId = (group: string, v: string) => `${group}-tab-${v}`;

interface TabsProps<T extends string> {
  group: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}

/** WAI-ARIA tabs: roving tabindex, arrow keys, Home/End. The caller renders the matching role="tabpanel" with id={group}-panel. */
export function Tabs<T extends string>({ group, label, value, options, onChange, size = "md" }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = options.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl border border-stroke bg-field p-0.5">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => void (refs.current[i] = el)}
            id={tabId(group, o.value)}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={`${group}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`whitespace-nowrap rounded-lg font-medium ${size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"} ${focusRing} ${on ? "bg-accent text-primary-ink" : "text-ink/70 hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ViewSwitch({ active }: { active: "profile" | "portfolio" | "recommended" }) {
  const { t } = useDash();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const onPortfolio = active !== "profile";
  const tab = "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold sm:px-4";
  const opts = [
    { href: "/dashboard/portfolio", on: active === "portfolio", label: t.match.viewReal },
    { href: "/dashboard/portfolio/recommended", on: active === "recommended", label: t.match.viewRec },
  ];
  return (
    <nav aria-label={t.home.switchLabel} className="inline-flex rounded-xl border border-stroke bg-field p-0.5">
      <Link href="/dashboard" aria-current={active === "profile" ? "page" : undefined} className={`${tab} ${focusRing} ${active === "profile" ? "bg-accent font-bold text-white" : "text-ink hover:bg-surface"}`}>
        <UserIcon aria-hidden className="size-4" />
        {t.home.profile}
      </Link>
      <div ref={ref} className="relative">
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${tab} ${focusRing} ${onPortfolio ? "bg-accent font-bold text-white" : "text-ink hover:bg-surface"}`}>
          <BriefcaseIcon aria-hidden className="size-4" />
          {t.home.portfolio}
          <ChevronIcon aria-hidden className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ul role="menu" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-stroke bg-surface p-1 shadow-xl">
            {opts.map((o) => (
              <li key={o.href} role="none">
                <Link role="menuitemradio" aria-checked={o.on} href={o.href} onClick={() => setOpen(false)} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${focusRing} ${o.on ? "bg-accent/15 font-semibold text-accent" : "text-ink hover:bg-card"}`}>
                  {o.label}
                  {o.on && <span aria-hidden>{"\u2713"}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useDash();
  return (
    <div role="alert" className="rounded-2xl border border-loss/30 bg-loss/10 p-5">
      <p className="text-sm text-loss">{message}</p>
      <button type="button" onClick={onRetry} className={`mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink ${focusRing}`}>
        {t.retry}
      </button>
    </div>
  );
}

export function Sk({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-surface motion-reduce:animate-none ${className}`} />;
}

export function LoadingRegion({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-xl text-sm text-ink/70">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

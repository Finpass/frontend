"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/state/auth-context";

export const ONBOARDING = "/onboarding";

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Button({
  href = ONBOARDING,
  children,
  variant = "primary",
  className = "",
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "mint";
  className?: string;
}) {
  const { user, openAuth } = useAuth();
  const v = {
    primary: "bg-ink text-paper hover:bg-white",
    ghost: "border border-ink/30 text-ink hover:bg-ink/10",
    mint: "bg-accent text-paper hover:bg-white",
  }[variant];
  const cls = `inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${v} ${className}`;
  if (href === ONBOARDING && !user) {
    return (
      <button type="button" onClick={() => openAuth("register")} className={cls}>
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Chip({ children, ai = false }: { children: ReactNode; ai?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        ai ? "bg-accent text-paper" : "border border-ink/15 bg-card"
      }`}
    >
      {children}
    </span>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  dark = false,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  dark?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 px-4 py-20 sm:px-6 md:py-28 ${dark ? "bg-panel" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title) && (
          <Reveal className="mb-12 max-w-3xl">
            {eyebrow && <p className={`mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent`}>{eyebrow}</p>}
            {title && <h2 className="font-display text-4xl uppercase leading-[1.05] sm:text-6xl">{title}</h2>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

export function Card({ children, className = "", ai = false }: { children: ReactNode; className?: string; ai?: boolean }) {
  return (
    <div className={`rounded-3xl p-6 ${ai ? "glow-border bg-card" : "card-edge bg-card"} ${className}`}>{children}</div>
  );
}

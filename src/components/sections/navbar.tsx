"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/ui";
import { useAuth } from "@/features/auth/state/auth-context";

export function Navbar() {
  const { d } = useT();
  const { user, status, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-ink/10 bg-card/70 px-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-6">
        <a href="#top" className="font-display text-xl uppercase tracking-wide">
          Finpass<span className="text-gain">.</span>
        </a>
        <ul className="hidden items-center gap-6 text-sm font-semibold lg:flex">
          {d.nav.links.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className="hover:text-gain">{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Button className="hidden !min-h-10 !py-2 sm:inline-flex">{user ? "Continue" : d.nav.cta}</Button>
          <button className="lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="block h-0.5 w-6 bg-ink shadow-[0_6px_0_#0a0a0a,0_-6px_0_#0a0a0a]" />
          </button>
        </div>
      </nav>
      {open && (
        <ul className="mx-auto mt-2 max-w-6xl rounded-3xl border border-ink/10 bg-card/90 px-5 py-3 backdrop-blur-xl lg:hidden">
          {d.nav.links.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} onClick={() => setOpen(false)} className="block py-3 font-semibold">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** Sticky CTA, mobile only. */
export function StickyCta() {
  const { d } = useT();
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-paper/90 p-3 backdrop-blur sm:hidden">
      <Button className="w-full">{d.nav.ctaShort}</Button>
    </div>
  );
}

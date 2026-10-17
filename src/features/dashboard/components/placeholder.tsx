"use client";

import Link from "next/link";
import { useDash } from "@/features/dashboard/state/use-dash";
import { SparkIcon } from "./icons";
import { PageTitle, card, focusRing } from "./ui";

export function Placeholder() {
  const { t } = useDash();
  const s = t.soon;
  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <PageTitle title={s.advisoryTitle} />
      <section className={`${card} relative overflow-hidden p-6 sm:p-10`}>
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"><SparkIcon className="size-7" /></span>
          <div>
            <span className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-xs font-semibold text-warn">{s.badge}</span>
            <p className="mt-4 max-w-xl text-ink/80">{s.advisoryBody}</p>
            <ul className="mt-5 space-y-2 text-sm text-ink/75">
              {s.advisoryItems.map((i) => (
                <li key={i} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />{i}</li>
              ))}
            </ul>
            <Link href="/dashboard" className={`mt-7 inline-block rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold ${focusRing}`}>{s.back}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

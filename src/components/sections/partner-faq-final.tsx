"use client";

import { Brand } from "@/components/brand";
import { useT } from "@/lib/i18n";
import { Button, Chip, Reveal, Section } from "@/components/ui/ui";
import { HeroScene } from "@/components/3d/scenes";

export function Partner() {
  const { d } = useT();
  return (
    <Section eyebrow={d.partner.eyebrow} title={d.partner.title}>
      <Reveal className="rounded-3xl bg-card p-8">
        <p className="max-w-2xl text-lg">{d.partner.body}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {d.partner.who.map((w) => <li key={w}><Chip>{w}</Chip></li>)}
        </ul>
        <Button href="mailto:partners@example.com" className="mt-6">{d.partner.cta}</Button>
      </Reveal>
    </Section>
  );
}

export function Faq() {
  const { d } = useT();
  return (
    <Section id="faq" eyebrow={d.faq.eyebrow} title={d.faq.title}>
      <div className="max-w-3xl space-y-3">
        {d.faq.items.map((it) => (
          <details key={it.q} className="group rounded-3xl bg-card p-5 open:bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold">
              {it.q}
              <span aria-hidden className="text-2xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-ink/80">{it.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  const { d } = useT();
  return (
    <section className="overflow-hidden bg-panel px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-5xl uppercase leading-none sm:text-7xl">{d.final.title}</h2>
          <Button variant="mint" className="mt-8">{d.final.cta}</Button>
          <p className="mt-6 max-w-md text-sm text-ink/60">{d.footer.disclaimer}</p>
        </Reveal>
        <HeroScene label={d.tagline} className="aspect-square w-full max-w-md justify-self-center" />
      </div>
    </section>
  );
}

export function Footer() {
  const { d } = useT();
  return (
    <footer className="border-t border-ink/10 bg-paper px-4 pb-24 pt-8 text-ink/60 sm:px-6 sm:pb-8">
      <div className="mx-auto max-w-6xl text-sm">
        <p className="font-display text-xl uppercase text-ink"><Brand name={d.brand} /></p>
        <p className="mt-3 max-w-2xl">{d.footer.disclaimer}</p>
        <p className="mt-4 text-xs">© {d.brand}. {d.footer.rights}</p>
      </div>
    </footer>
  );
}

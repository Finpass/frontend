"use client";

import { useT } from "@/lib/i18n";
import { Button, Chip, Reveal } from "@/components/ui/ui";
import { HeroScene } from "@/components/3d/scenes";

export function Hero() {
  const { d } = useT();
  return (
    <section id="top" className="overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pt-36">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
        <Reveal>
          <h1 className="font-display text-4xl uppercase leading-[0.95] sm:text-8xl">{d.hero.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-ink/80">{d.hero.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button>{d.hero.cta1}</Button>
            <Button href="#briefing" variant="ghost">{d.hero.cta2}</Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {d.hero.chips.map((c) => (
              <li key={c}><Chip>{c}</Chip></li>
            ))}
          </ul>
        </Reveal>
        <HeroScene label={d.tagline} className="aspect-[6/5] w-full justify-self-center lg:w-[112%]" />
      </div>
    </section>
  );
}

"use client";

import { useT } from "@/lib/i18n";
import { Card, Reveal, Section } from "@/components/ui/ui";
import { PropScene, type PropKind } from "@/components/3d/scenes";

const props: PropKind[] = ["piggy", "bars", "key"];

export function Personas() {
  const { d } = useT();
  return (
    <Section eyebrow={d.personas.eyebrow} title={d.personas.title}>
      <div className="grid gap-5 md:grid-cols-3">
        {d.personas.cards.map((c, i) => (
          <Reveal key={c.t} delay={i * 0.1}>
            <Card className="h-full">
              <PropScene kind={props[i]} label={c.t} className="h-36 w-full" />
              <h3 className="mt-2 text-xl font-extrabold">{c.t}</h3>
              <p className="mt-2 text-ink/75">{c.d}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function Security() {
  const { d } = useT();
  return (
    <Section id="keamanan" eyebrow={d.security.eyebrow} title={d.security.title} className="bg-card/50">
      <div className="grid gap-5 sm:grid-cols-2">
        {d.security.items.map((it, i) => (
          <Reveal key={it.t} delay={i * 0.08}>
            <Card className="flex h-full gap-4">
              <PropScene kind="shield" label={it.t} className="h-16 w-16 shrink-0" />
              <div>
                <h3 className="text-lg font-extrabold">{it.t}</h3>
                <p className="text-ink/75">{it.d}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

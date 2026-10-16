"use client";

import { useT } from "@/lib/i18n";
import { Card, Reveal, Section } from "@/components/ui/ui";

export function Problem() {
  const { d } = useT();
  return (
    <Section eyebrow={d.problem.eyebrow} title={d.problem.title}>
      <div className="grid gap-5 md:grid-cols-3">
        {d.problem.cards.map((c, i) => (
          <Reveal key={c.t} delay={i * 0.1}>
            <Card className="h-full">
              <span className="font-display text-5xl text-gain">0{i + 1}</span>
              <h3 className="mt-4 text-xl font-extrabold">{c.t}</h3>
              <p className="mt-2 text-ink/75">{c.d}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

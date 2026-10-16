"use client";

import { useT } from "@/lib/i18n";
import { Card, Reveal, Section } from "@/components/ui/ui";
import { PropScene, type PropKind } from "@/components/3d/scenes";

const icons: PropKind[] = ["key", "shield", "bars"];

export function HowItWorks() {
  const { d } = useT();
  const w = d.how.wizard;
  return (
    <Section id="cara-kerja" eyebrow={d.how.eyebrow} title={d.how.title}>
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <ol className="space-y-5">
          {d.how.steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.1}>
              <li>
                <Card className="flex items-center gap-4">
                  <PropScene kind={icons[i]} label={s.t} className="h-24 w-24 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-accent">{i + 1}</p>
                    <h3 className="text-xl font-extrabold">{s.t}</h3>
                    <p className="text-ink/75">{s.d}</p>
                  </div>
                </Card>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          {/* static mock of the onboarding wizard */}
          <div className="rounded-3xl bg-card p-6 card-edge shadow-xl" aria-label="Mockup wizard">
            <p className="text-sm font-bold">{w.progress}</p>
            <div className="mt-2 h-2 rounded-full bg-ink/10" role="progressbar" aria-valuenow={2} aria-valuemin={0} aria-valuemax={6}>
              <div className="h-2 w-2/6 rounded-full bg-gain" />
            </div>
            <fieldset className="mt-6">
              <legend className="font-extrabold">{w.q}</legend>
              <div className="mt-3 space-y-2">
                {w.options.map((o, i) => (
                  <label key={o} className="flex items-center gap-3 rounded-2xl border border-ink/15 p-3">
                    <input type="radio" name="mock-debt" defaultChecked={i === 0} className="accent-gain" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-6 block text-sm font-bold">
              {w.income}
              <input readOnly value={w.incomeValue} className="mt-1 w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-lg font-semibold" />
            </label>
            <div className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper">{w.next}</div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

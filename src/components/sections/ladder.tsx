"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { Reveal, Section } from "@/components/ui/ui";
import { LadderScene } from "@/components/3d/scenes";

export function Ladder() {
  const { d } = useT();
  const [active, setActive] = useState(3);
  const lv = d.ladder.levels;
  return (
    <Section id="financial-ladder" eyebrow={d.ladder.eyebrow} title={d.ladder.title} className="bg-card/50">
      <p className="-mt-6 mb-8 text-ink/70">{d.ladder.sub}</p>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <LadderScene active={active} onSelect={setActive} label={d.ladder.title} className="aspect-[5/4] w-full" />
        <div>
          <ul className="space-y-2">
            {lv.map((l, i) => (
              <li key={l.t}>
                <button
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  aria-pressed={active === i}
                  className={`w-full rounded-3xl p-4 text-left transition-colors ${active === i ? "bg-accent text-paper" : "card-edge bg-card hover:bg-ink/5"}`}
                >
                  <span className={`font-display text-2xl ${active === i ? "text-paper" : "text-gain"}`}>
                    L{i + 1}
                  </span>{" "}
                  <span className="font-extrabold">{l.t}</span>
                  {active === i && <p className="mt-1 text-sm text-paper/75">{l.d}</p>}
                </button>
              </li>
            ))}
          </ul>
          <Reveal className="mt-6 rounded-3xl bg-card p-5">
            <p className="font-extrabold">{d.ladder.progress}</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10">
              <motion.div className="h-3 rounded-full bg-gain" initial={{ width: 0 }} whileInView={{ width: "32%" }} viewport={{ once: true }} transition={{ duration: 1 }} />
            </div>
            <p className="mt-2 text-xs text-ink/60">{d.ladder.progressNote}</p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

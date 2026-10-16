"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { Reveal, Section } from "@/components/ui/ui";

// result = min-ish blend of capacity (row) and willingness (col): 0 conservative, 1 moderate, 2 aggressive
const result = (cap: number, will: number) => (cap + will <= 1 ? 0 : cap + will >= 3 ? 2 : 1);
const tone = ["bg-[#16203f]", "bg-[#2a3a7a]", "bg-accent text-paper"];

export function RiskProfile() {
  const { d } = useT();
  const r = d.risk;
  return (
    <Section eyebrow={r.eyebrow} title={r.title}>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="text-lg text-ink/80">{r.body}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {r.labels.map((l, i) => (
              <li key={l} className={`rounded-full px-4 py-2 text-sm font-bold ${tone[i]}`}>{l}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink/70">{r.note}</p>
        </div>
        <div>
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 text-xs font-bold">
            <span />
            {r.axis.map((a) => <span key={a} className="text-center">{a}</span>)}
            {[2, 1, 0].map((cap) => (
              <div key={cap} className="contents">
                <span className="self-center pr-1 [writing-mode:vertical-rl] rotate-180">{r.axis[cap]}</span>
                {[0, 1, 2].map((will) => {
                  const k = result(cap, will);
                  return (
                    <Reveal key={will} delay={(2 - cap + will) * 0.07}>
                      <motion.div
                        whileHover={{ scale: 1.06 }}
                        className={`grid aspect-square place-items-center rounded-2xl p-1 text-center text-[11px] sm:text-sm ${tone[k]}`}
                      >
                        {r.labels[k]}
                      </motion.div>
                    </Reveal>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm font-bold">{r.willingness} (left to right)</p>
          <p className="text-center text-xs text-ink/60">{r.capacity} (bottom to top)</p>
        </div>
      </div>
    </Section>
  );
}

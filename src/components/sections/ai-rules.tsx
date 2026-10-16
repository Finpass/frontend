"use client";

import { useEffect, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useT } from "@/lib/i18n";
import { Card, Chip, Reveal, Section } from "@/components/ui/ui";
import { OrbScene } from "@/components/3d/scenes";

/** Streaming-text demo: dots "thinking", then types out. Static when reduced motion. */
function StreamDemo({ thinking, text, onHover }: { thinking: string; text: string; onHover: (v: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    let i = 0;
    const wait = setTimeout(() => {
      const t = setInterval(() => {
        setN(++i);
        if (i >= text.length) clearInterval(t);
      }, 22);
    }, 1200);
    return () => clearTimeout(wait);
  }, [inView, reduce, text]);
  const shown = reduce ? text.length : n;
  return (
    <div ref={ref} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <Card ai className="min-h-44">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">{shown === 0 ? `${thinking}...` : "LLM Explainer"}</p>
        <p className={`text-lg leading-relaxed ${shown < text.length ? "caret" : ""}`} aria-live="polite">{text.slice(0, shown)}</p>
      </Card>
    </div>
  );
}

function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
      {steps.map((s, i) => (
        <div key={s} className="contents">
          <div className={`glow-border rounded-2xl bg-card p-4 text-center text-sm font-bold ${i === 1 ? "text-accent" : ""}`}>{s}</div>
          {i < steps.length - 1 && (
            <svg className="mx-auto h-8 w-8 rotate-90 md:h-4 md:w-12 md:rotate-0" viewBox="0 0 48 16" aria-hidden>
              <line x1="0" y1="8" x2="42" y2="8" stroke="#8ea2ff" strokeWidth="2" className="flow-line" />
              <path d="M40 3l7 5-7 5" fill="none" stroke="#8ea2ff" strokeWidth="2" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

export function AiRules() {
  const { d } = useT();
  const [pulse, setPulse] = useState(false);
  return (
    <Section dark id="ai" eyebrow={d.ai.eyebrow} title={d.ai.title} className="relative overflow-hidden">
      {/* grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(#8ea2ff 1px,transparent 1px),linear-gradient(90deg,#8ea2ff 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-lg text-ink/80">{d.ai.body}</p>
            <ul className="mt-6 space-y-3">
              {d.ai.bullets.map((b) => (
                <li key={b} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />{b}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {d.ai.chips.map((c) => <Chip key={c} ai>{c}</Chip>)}
            </div>
          </div>
          <OrbScene pulse={pulse} label="AI" className="mx-auto aspect-square w-full max-w-sm" />
        </div>
        <Reveal className="mt-14"><Flow steps={d.ai.flow} /></Reveal>
        <Reveal className="mx-auto mt-10 max-w-2xl">
          <StreamDemo thinking={d.ai.thinking} text={d.ai.demo} onHover={setPulse} />
        </Reveal>
      </div>
    </Section>
  );
}

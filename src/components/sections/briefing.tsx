"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useT, type Dict } from "@/lib/i18n";
import { Section } from "@/components/ui/ui";

type Msg = { id: string; from: "bot" | "me" | "card"; text: string };

const buildSteps = (c: Dict["briefing"]["chat"]) => {
  const msgs: Msg[] = [
    { id: "greet", from: "bot", text: c.greeting },
    { id: "news", from: "bot", text: c.news },
    { id: "macro", from: "bot", text: c.macro },
    { id: "action", from: "bot", text: c.action },
    { id: "user", from: "me", text: c.user },
    { id: "reply", from: "bot", text: c.reply },
    { id: "card", from: "card", text: c.cardBody },
  ];
  return msgs;
};

const Avatar = () => (
  <span className="mb-0.5 h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-accent to-gain" aria-hidden />
);

function Typing() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      className="flex items-end gap-2"
    >
      <Avatar />
      <div className="flex gap-1 rounded-2xl bg-[#202c33] px-3 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function Bubble({ m, c }: { m: Msg; c: Dict["briefing"]["chat"] }) {
  const base = { initial: { opacity: 0, y: 14, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.35, ease: "easeOut" as const } };
  if (m.from === "me")
    return (
      <motion.div {...base} className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1f6f4a] px-3 py-2 text-[13px] text-white">
        {m.text}
      </motion.div>
    );
  if (m.from === "card")
    return (
      <motion.div {...base} className="flex items-end gap-2">
        <Avatar />
        <div className="max-w-[88%] rounded-2xl border border-gain/30 bg-[#0f1f1a] p-3 text-[12px]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold tracking-wider text-white/80">{c.cardTitle}</span>
            <span className="rounded-full bg-gain/15 px-2 py-0.5 text-[10px] text-gain">{c.cardTag}</span>
          </div>
          <p className="mt-1 text-white/50">{c.cardMeta}</p>
          <p className="mt-1.5 text-white/90">{m.text}</p>
        </div>
      </motion.div>
    );
  return (
    <motion.div {...base} className="flex items-end gap-2">
      <Avatar />
      <p className="max-w-[82%] rounded-2xl rounded-bl-sm bg-[#202c33] px-3 py-2 text-[13px] leading-snug text-[#e9edef]">{m.text}</p>
    </motion.div>
  );
}

/** Looping chat: bubbles arrive one by one, with a typing indicator before each bot message. */
function PhoneChat({ chat, onStep }: { chat: Dict["briefing"]["chat"]; onStep: (n: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const all = buildSteps(chat);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => onStep(shown), [shown, onStep]);

  useEffect(() => {
    if (reduce || !inView) return;
    let dead = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => !dead && fn(), ms));
    const run = (i: number) => {
      if (i >= all.length) return at(5000, () => { setShown(0); run(0); });
      const bot = all[i].from !== "me";
      if (bot) {
        setTyping(true);
        at(1100, () => { setTyping(false); setShown(i + 1); at(900, () => run(i + 1)); });
      } else {
        at(900, () => { setShown(i + 1); at(600, () => run(i + 1)); });
      }
    };
    run(shown);
    return () => { dead = true; timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);

  const list = reduce ? all : all.slice(0, shown);

  return (
    <div ref={ref} className="relative mx-auto h-[640px] w-[300px] rounded-[48px] border-[3px] border-[#c9cedd] bg-black p-[7px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
      <div className="absolute left-1/2 top-4 z-10 h-7 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden />
      <div className="flex h-full flex-col overflow-hidden rounded-[40px] bg-[#0b141a]">
        <div className="flex items-center gap-2 px-3 pb-3 pt-14">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M19 12H5m6-7l-7 7 7 7" /></svg>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#25d366]" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden><path d="M12 3a9 9 0 0 0-7.800 13.500L3 21l4.700-1.200A9 9 0 1 0 12 3Zm-3 5.500c.2-.4.500-.4.800-.4l.5.100.9 2c.1.300 0 .5-.2.700l-.5.600c.7 1.300 1.700 2.200 3.100 2.800l.7-.8c.2-.2.400-.2.700-.1l1.900.9c.2.100.3.300.2.600-.2.900-1.200 1.500-2.100 1.400-2.900-.4-5.500-3-5.900-5.800 0-.6.200-1.200.6-1.600Z" /></svg>
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-semibold text-white">WhatsApp</p>
            <p className="truncate text-[11px] text-white/55">{chat.header}</p>
          </div>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/80" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.600" /><circle cx="12" cy="12" r="1.600" /><circle cx="12" cy="19" r="1.600" /></svg>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-3 pb-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {list.map((m) => <Bubble key={m.id} m={m} c={chat} />)}
            {typing && <Typing key="typing" />}
          </AnimatePresence>
        </div>
        <p className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-[10px] text-white/45">
          <span className="h-1.5 w-1.5 rounded-full bg-gain" aria-hidden />
          {chat.note}
        </p>
      </div>
    </div>
  );
}

function Feature({ f, active }: { f: { t: string; d: string }; active: boolean }) {
  return (
    <div className={`rounded-2xl p-6 transition-colors duration-500 lg:p-8 ${active ? "border border-stroke bg-card" : "border border-transparent"}`}>
      <h3 className={`font-app text-xl font-semibold transition-colors duration-500 sm:text-2xl ${active ? "text-ink" : "text-ink/50"}`}>{f.t}</h3>
      <p className={`mt-3 text-base leading-relaxed transition-colors duration-500 ${active ? "text-ink/80" : "text-ink/40"}`}>{f.d}</p>
    </div>
  );
}

export function Briefing() {
  const { d } = useT();
  const [step, setStep] = useState(0);
  const onStep = useCallback((n: number) => setStep(n), []);
  const f = d.briefing.features;
  // the highlighted feature follows the chat: ladder, holdings, risk, then the alert card
  const active = step >= 7 ? 3 : step >= 5 ? 2 : step >= 3 ? 1 : 0;
  return (
    <Section id="briefing" eyebrow={d.briefing.eyebrow} title={d.briefing.title}>
      <div className="mt-6 rounded-3xl border border-stroke bg-panel/60 px-4 pb-8 sm:px-8 lg:mt-24 lg:pb-0 lg:pt-0">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_340px_1fr] lg:gap-4">
          <div className="order-2 grid gap-2 lg:order-1 lg:gap-14 lg:py-12">
            <Feature f={f[0]} active={active === 0} />
            <Feature f={f[1]} active={active === 1} />
          </div>
          <div className="relative order-1 mx-auto h-[560px] w-[300px] lg:order-2 lg:-mt-16 lg:h-[640px] lg:w-[340px]">
            <div aria-hidden className="absolute inset-x-0 bottom-0 top-16 bg-[linear-gradient(180deg,#2a4fd8_0%,#4f7bff_45%,#8ea2ff_100%)] [mask-image:linear-gradient(180deg,#000,#000)] shadow-[inset_0_0_80px_rgba(7,11,22,0.35)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 top-16 opacity-30 mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:3px_3px]" />
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
              <div className="relative mx-auto w-[300px] origin-top">
                <PhoneChat chat={d.briefing.chat} onStep={onStep} />
              </div>
            </div>
          </div>
          <div className="order-3 grid gap-2 lg:gap-14 lg:py-12">
            <Feature f={f[2]} active={active === 2} />
            <Feature f={f[3]} active={active === 3} />
          </div>
        </div>
      </div>
    </Section>
  );
}

"use client";

import { Sparkline } from "./charts";
import { Delta, Sk, card } from "./ui";

interface Props {
  label: string;
  value: string;
  changePct: number;
  suffix?: string;
  sparkline: number[];
  color: string;
}

export function KpiCard({ label, value, changePct, suffix, sparkline, color }: Props) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <p className="text-sm text-ink/70">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <Delta value={changePct} suffix={suffix} />
        <div className="h-9 w-24 shrink-0"><Sparkline values={sparkline} color={color} /></div>
      </div>
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <Sk key={i} className="h-28" />)}
    </div>
  );
}

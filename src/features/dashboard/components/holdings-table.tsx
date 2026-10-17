"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { notifyError } from "@/lib/notify-error";
import { ConfirmDialog } from "@/features/profile/components/common";
import { holdingsApi } from "@/features/dashboard/api/dashboard-api";
import { idr, pct, signedIdr } from "@/features/dashboard/lib/format";
import { classColor, classOptions, filterHoldings, initials } from "@/features/dashboard/lib/holdings";
import { useDash } from "@/features/dashboard/state/use-dash";
import { useDismiss } from "@/features/dashboard/state/use-dismiss";
import type { Holding, HoldingRow, PortfolioData } from "@/features/dashboard/types";
import { Sparkline } from "./charts";
import { CashDialog } from "./cash-dialog";
import { HoldingDialog } from "./holding-dialog";
import { FilterIcon, KebabIcon, PlusIcon, SearchIcon } from "./icons";
import { card, focusRing } from "./ui";

const NA = <span className="text-ink/50">-</span>;

const EN_CLASS: Record<string, string> = { equity: "Stocks", stock: "Stocks", bond_sbn: "Government bond", mutual_fund: "Mutual fund", deposit: "Deposit", cash: "Cash", commodity: "Commodity", other: "Other" };

export function HoldingsSection({ items, footer, onChanged }: { items: HoldingRow[]; footer: PortfolioData["footer"]; onChanged: () => void }) {
  const { lang, t } = useDash();
  const p = t.pf;
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cls, setCls] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialog, setDialog] = useState<"closed" | "new" | Holding>("closed");
  const [deleting, setDeleting] = useState<Holding | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const cashRow = items.find((x) => x.isCash);
  const instruments = items.filter((x) => !x.isCash).length;
  const [busy, setBusy] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useDismiss(filterRef, filterOpen, () => setFilterOpen(false));

  const options = useMemo(() => classOptions(items), [items]);
  const codes = useMemo(() => options.map((o) => o.key), [options]);
  const shown = useMemo(() => filterHoldings(items, query, cls), [items, query, cls]);
  const label = (h: Pick<Holding, "assetClass" | "assetClassLabelId">) => (lang === "id" ? h.assetClassLabelId : (EN_CLASS[h.assetClass] ?? h.assetClassLabelId));

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await holdingsApi.remove(deleting.id);
      toast.success(t.hd.deleted);
      setDeleting(null);
      onChanged();
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  };

  const th = "px-3 py-3 text-left text-xs font-semibold text-ink/70";
  return (
    <section aria-labelledby="holdings-title" className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <h2 id="holdings-title" className="text-lg font-bold">{p.holdingsTitle}</h2>
          <span className="rounded-full border border-stroke bg-paper px-2.5 py-0.5 text-xs text-ink/80">{p.instruments.replace("{n}", String(instruments))}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {searchOpen && (
            <input autoFocus type="search" aria-label={p.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={p.searchPlaceholder} className={`h-10 w-44 rounded-xl border border-stroke bg-field px-3 text-sm sm:w-56 ${focusRing}`} />
          )}
          <button type="button" aria-label={p.search} aria-expanded={searchOpen} onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setQuery(""); }} className={`grid size-10 place-items-center rounded-xl border border-stroke ${focusRing}`}>
            <SearchIcon className="size-4" />
          </button>
          <div ref={filterRef} className="relative">
            <button type="button" aria-expanded={filterOpen} aria-haspopup="true" onClick={() => setFilterOpen((o) => !o)} className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm ${focusRing} ${cls === "all" ? "border-stroke" : "border-accent text-accent"}`}>
              <FilterIcon className="size-4" />{p.filter}
            </button>
            {filterOpen && (
              <div role="group" aria-label={p.filterLabel} className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-stroke bg-surface p-1 shadow-xl">
                {[{ key: "all", label: p.allClasses }, ...options.map((o) => ({ key: o.key, label: label({ assetClass: o.key, assetClassLabelId: o.label }) }))].map((o) => (
                  <button key={o.key} type="button" aria-pressed={cls === o.key} onClick={() => { setCls(o.key); setFilterOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-paper ${focusRing} ${cls === o.key ? "font-bold text-accent" : ""}`}>
                    {o.label}{cls === o.key && <span aria-hidden>{"✓"}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={() => setDialog("new")} className={`flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-ink ${focusRing}`}>
            <PlusIcon className="size-4" />{p.add}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-lg font-bold">{p.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">{p.emptyBody}</p>
          <button type="button" onClick={() => setDialog("new")} className={`mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink ${focusRing}`}>{p.add}</button>
        </div>
      ) : (
        <div role="region" tabIndex={0} aria-label={`${p.tableLabel}. ${p.scroll}`} className={`overflow-x-auto ${focusRing}`}>
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <caption className="sr-only">{p.tableLabel}</caption>
            <thead>
              <tr className="border-b border-stroke">
                <th scope="col" className={`${th} pl-4 sm:pl-6`}>{p.colAsset}</th>
                <th scope="col" className={th}>{p.colClass}</th>
                <th scope="col" className={th}>{p.colPrice}</th>
                <th scope="col" className={th}>{p.colValue}</th>
                <th scope="col" className={th}>{p.col1d}</th>
                <th scope="col" className={th}>{p.colReturn}</th>
                <th scope="col" className={th}>{p.colWeight}</th>
                <th scope="col" className={th}>{p.colTrend}</th>
                <th scope="col" className={`${th} text-right pr-3 sm:pr-6`}>{p.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((h) => (
                <Row key={h.id} h={h} color={classColor(h.assetClass, codes)} classLabel={label(h)} onEdit={() => (h.isCash ? setCashOpen(true) : setDialog(h))} onDelete={() => setDeleting(h)} />
              ))}
              {shown.length === 0 && <tr><td colSpan={9} className="px-6 py-10 text-center text-ink/70">{p.noMatch}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-stroke px-4 py-4 text-xs text-ink/70 sm:px-6">
        <p>{p.footerShown.replace("{shown}", String(shown.length)).replace("{total}", String(items.length))}</p>
        <p className="flex flex-wrap gap-x-6 gap-y-1">
          <span>{p.unrealized}: <b className={footer.unrealized < 0 ? "text-loss" : "text-gain"}>{signedIdr(footer.unrealized)}</b></span>
          <span>{p.dividends}: <b className="text-ink">{idr(footer.dividendsAccumulated)}</b></span>
        </p>
      </div>

      {dialog !== "closed" && <HoldingDialog holding={dialog === "new" ? null : dialog} onClose={() => setDialog("closed")} onSaved={onChanged} />}
      {cashOpen && cashRow && <CashDialog amount={cashRow.marketValue} onClose={() => setCashOpen(false)} onSaved={onChanged} />}
      {deleting && (
        <ConfirmDialog title={t.hd.delTitle} body={t.hd.delBody.replace("{name}", deleting.symbol ?? deleting.name)} confirm={t.hd.delConfirm} cancel={t.hd.cancel} pending={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
      )}
    </section>
  );
}

function Row({ h, color, classLabel, onEdit, onDelete }: { h: HoldingRow; color: string; classLabel: string; onEdit: () => void; onDelete: () => void }) {
  const { lang, t } = useDash();
  const tone = (n: number) => (n < 0 ? "text-loss" : "text-gain");
  const td = "px-3 py-4 align-middle";
  return (
    <tr className="border-b border-stroke/60 last:border-0">
      <th scope="row" className={`${td} text-left font-normal pl-4 sm:pl-6`}>
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-paper" style={{ background: color }}>{initials(h).slice(0, 3)}</span>
          <div className="min-w-0">
            <p className="font-bold">{h.isCash ? t.pf.cashName : (h.symbol ?? h.name)}</p>
            <p className="max-w-32 text-xs text-ink/60">{h.isCash ? t.pf.cashSub : h.symbol ? h.name : h.subtitle}</p>
          </div>
        </div>
      </th>
      <td className={td}><p>{classLabel}</p>{h.symbol && h.subtitle && <p className="text-xs text-ink/55">{h.subtitle}</p>}</td>
      <td className={`${td} whitespace-nowrap font-semibold`}>{h.isCash ? NA : idr(h.lastPrice)}{h.isManual && <span className="font-normal text-ink/55"> {t.pf.perUnit}</span>}</td>
      <td className={td}><p className="whitespace-nowrap font-semibold">{idr(h.marketValue)}</p>{!h.isCash && <p className="whitespace-nowrap text-xs text-ink/55">{t.pf.cost.replace("{v}", idr(h.costBasis))}</p>}</td>
      <td className={`${td} whitespace-nowrap font-semibold ${tone(h.change1dPct)}`}>{h.isCash ? NA : pct(h.change1dPct, lang, { sign: true, digits: 2 })}</td>
      <td className={`${td} whitespace-nowrap ${h.isCash ? "text-ink/55" : tone(h.totalReturnPct)}`}>{h.isCash ? NA : <><p className="font-semibold">{pct(h.totalReturnPct, lang, { sign: true })}</p><p className="text-xs">{signedIdr(h.totalReturnIDR)}</p></>}</td>
      <td className={`${td} whitespace-nowrap font-semibold`}>{pct(h.weightPct, lang)}</td>
      <td className={td}>{h.isCash ? NA : <div className="h-8 w-20"><Sparkline values={h.trend1y} color={color} height={32} fill={false} label={t.pf.trendFor.replace("{name}", h.symbol ?? h.name)} /></div>}</td>
      <td className={`${td} text-right pr-3 sm:pr-6`}><RowMenu h={h} onEdit={onEdit} onDelete={onDelete} /></td>
    </tr>
  );
}

function RowMenu({ h, onEdit, onDelete }: { h: HoldingRow; onEdit: () => void; onDelete: () => void }) {
  const { t } = useDash();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); btn.current?.focus(); };
  useDismiss(ref, open, () => setOpen(false));
  const items = (e: React.KeyboardEvent) => {
    const els = [...(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") els[(i + 1) % els.length]?.focus();
    else if (e.key === "ArrowUp") els[(i - 1 + els.length) % els.length]?.focus();
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
  };
  return (
    <div ref={ref} className="relative inline-block" onKeyDown={items}>
      <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t.pf.rowMenu.replace("{name}", h.isCash ? t.pf.cashName : (h.symbol ?? h.name))} onClick={() => setOpen((o) => !o)} className={`grid size-9 place-items-center rounded-lg text-ink/70 hover:bg-field ${focusRing}`}>
        <KebabIcon className="size-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-20 w-36 rounded-xl border border-stroke bg-surface p-1 text-left shadow-xl">
          <button type="button" role="menuitem" autoFocus onClick={() => { setOpen(false); onEdit(); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-paper ${focusRing}`}>{t.pf.edit}</button>
          {!h.isCash && <button type="button" role="menuitem" onClick={() => { setOpen(false); onDelete(); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm text-loss hover:bg-paper ${focusRing}`}>{t.pf.del}</button>}
        </div>
      )}
    </div>
  );
}

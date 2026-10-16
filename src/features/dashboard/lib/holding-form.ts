import { parseIdr } from "@/features/profile/numeric";
import { parseDecimal } from "@/features/dashboard/lib/format";
import type { CreateHoldingBody, UpdateHoldingBody } from "@/features/dashboard/types";

export const MANUAL_CLASSES = ["bond_sbn", "mutual_fund", "deposit", "other"] as const;

export type FormMode = "search" | "manual" | "edit";
export type Field = "instrument" | "name" | "assetClass" | "currentPrice" | "units" | "avgCost" | "acquiredAt";
export type FieldError = "required" | "positive" | "invalid" | "future";

export interface FormInput {
  mode: FormMode;
  symbol: string;
  name: string;
  assetClass: string;
  currentPrice: string;
  units: string;
  avgCost: string;
  acquiredAt: string;
  /** edit mode: whether the holding is a manual instrument (its price can be edited) */
  isManual?: boolean;
}

export type Errors = Partial<Record<Field, FieldError>>;

export type Validated =
  | { ok: true; create?: CreateHoldingBody; update?: UpdateHoldingBody }
  | { ok: false; errors: Errors };

/** Validates the form. `today` is YYYY-MM-DD in the user's calendar; acquiredAt must not be after it. */
export function validateHolding(f: FormInput, today: string): Validated {
  const errors: Errors = {};
  const units = parseDecimal(f.units);
  const avgCost = parseIdr(f.avgCost);
  const price = parseIdr(f.currentPrice);

  if (f.mode === "search" && !f.symbol) errors.instrument = "required";
  if (f.mode === "manual") {
    if (!f.name.trim()) errors.name = "required";
    if (!(MANUAL_CLASSES as readonly string[]).includes(f.assetClass)) errors.assetClass = "required";
  }
  if (f.mode === "manual" || (f.mode === "edit" && f.isManual)) {
    if (!f.currentPrice.trim()) errors.currentPrice = "required";
    else if (price === null) errors.currentPrice = "invalid";
    else if (price <= 0) errors.currentPrice = "positive";
  }

  if (!f.units.trim()) errors.units = "required";
  else if (units === null) errors.units = "invalid";
  else if (units <= 0) errors.units = "positive";

  if (!f.avgCost.trim()) errors.avgCost = "required";
  else if (avgCost === null) errors.avgCost = "invalid";
  else if (avgCost <= 0) errors.avgCost = "positive";

  if (!f.acquiredAt) errors.acquiredAt = "required";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.acquiredAt)) errors.acquiredAt = "invalid";
  else if (f.acquiredAt > today) errors.acquiredAt = "future";

  if (Object.keys(errors).length) return { ok: false, errors };

  const base = { units: units as number, avgCost: avgCost as number, acquiredAt: f.acquiredAt };
  if (f.mode === "edit") return { ok: true, update: { ...base, ...(f.isManual ? { currentPrice: price as number } : {}) } };
  if (f.mode === "search") return { ok: true, create: { symbol: f.symbol, ...base } };
  return {
    ok: true,
    create: { manual: { name: f.name.trim(), assetClass: f.assetClass, currency: "IDR", currentPrice: price as number }, ...base },
  };
}

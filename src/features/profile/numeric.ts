const UNITS: Record<string, number> = {
  k: 1e3,
  rb: 1e3,
  ribu: 1e3,
  jt: 1e6,
  juta: 1e6,
  miliar: 1e9,
};

/** Parses "15jt", "15 juta", "1,5jt", "15.000.000", "15000000", "Rp 15.000.000". Returns null when empty or invalid. */
export function parseIdr(raw: string): number | null {
  const s = raw.toLowerCase().replace(/rp\.?/g, "").replace(/\s+/g, "").trim();
  const m = /^([\d.,]+)([a-z]*)$/.exec(s);
  if (!m) return null;
  const [, num, unit] = m;
  let mult = 1;
  if (unit) {
    if (!(unit in UNITS)) return null;
    mult = UNITS[unit];
  }
  let n: number;
  if (!unit || /^\d{1,3}([.,]\d{3})+$/.test(num)) {
    if (!/^\d{1,3}([.,]\d{3})+$/.test(num) && !/^\d+$/.test(num)) return null;
    n = Number(num.replace(/[.,]/g, ""));
  } else {
    // "1,5" or "1.5" with a unit suffix is a decimal
    if (!/^\d+([.,]\d+)?$/.test(num)) return null;
    n = Number(num.replace(",", "."));
  }
  const v = Math.round(n * mult);
  return Number.isSafeInteger(v) ? v : null;
}

export const formatNumber = (n: number) => String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const formatIdr = (n: number) => `Rp ${formatNumber(n)}`;

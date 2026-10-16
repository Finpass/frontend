"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, toApiError } from "@/lib/api-error";
import { useProfileLang } from "@/features/profile/state/use-lang";
import { DASH } from "@/features/dashboard/i18n";

/** Language comes from the shared ID/EN provider; dashboard copy lives in its own dictionary. */
export function useDash() {
  const { lang, setLang } = useProfileLang();
  return { lang, setLang, t: DASH[lang] };
}

interface Done<T> {
  req: string;
  data: T | null;
  error: ApiError | null;
}

/**
 * Loads data for a key. Previous data stays visible while a new key or a reload is in flight,
 * so switching a range tab does not flash a skeleton over the whole page.
 */
export function useResource<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<Done<T>>({ req: "", data: null, error: null });
  const fn = useRef(fetcher);
  useEffect(() => {
    fn.current = fetcher;
  });
  const req = `${key}#${tick}`;

  useEffect(() => {
    const ac = new AbortController();
    fn.current(ac.signal).then(
      (data) => !ac.signal.aborted && setDone({ req, data, error: null }),
      (e) => !ac.signal.aborted && setDone((d) => ({ req, data: d.data, error: toApiError(e) })),
    );
    return () => ac.abort();
  }, [req]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  const loading = done.req !== req;
  return { data: done.data, error: loading ? null : done.error, loading, reload };
}

/** Debounced copy of a value. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export interface Chrome {
  search: string;
  setSearch: (s: string) => void;
  updatedAt: string | null;
  setUpdatedAt: (s: string | null) => void;
  plan: string;
  setPlan: (s: string) => void;
}

export const ChromeContext = createContext<Chrome | null>(null);

/** Top bar state that pages drive (news search, last updated time, plan name). */
export function useChrome() {
  const c = useContext(ChromeContext);
  if (!c) throw new Error("useChrome must be used inside DashboardShell");
  return c;
}

const subscribeMinute = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const minute = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Current time, refreshed each minute. Server render sees the epoch, so nothing time-dependent is prerendered. */
export function useNow(): Date {
  return new Date(useSyncExternalStore(subscribeMinute, minute, () => 0));
}

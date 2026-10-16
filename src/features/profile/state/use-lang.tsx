"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DICT, LANG_KEY, normalizeLang, type Dict } from "@/features/profile/i18n";
import type { Lang } from "@/features/profile/types";

interface LangValue {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangValue | null>(null);

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const read = (): Lang => {
  try {
    return normalizeLang(localStorage.getItem(LANG_KEY));
  } catch {
    return "id";
  }
};
const setLang = (l: Lang) => {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* storage blocked: the choice lasts until reload */
  }
  listeners.forEach((cb) => cb());
};

export function ProfileLangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, read, () => "id" as Lang);
  const value = useMemo(() => ({ lang, t: DICT[lang], setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useProfileLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useProfileLang must be used inside ProfileLangProvider");
  return ctx;
}

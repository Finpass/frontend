"use client";

import { createContext, useContext, type ReactNode } from "react";
import en from "@/locales/en.json";

export type Dict = typeof en;
const Ctx = createContext<{ d: Dict }>({ d: en });

export function LocaleProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={{ d: en }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

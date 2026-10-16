"use client";

import { useAuth } from "@/features/auth/state/auth-context";
import { FinancialView } from "./financial-view";
import { PortfolioView } from "./portfolio-view";

export function HomeRoute({ view }: { view: "profile" | "portfolio" }) {
  const { user } = useAuth();
  const name = user?.name.split(" ")[0] ?? "";
  return view === "profile" ? <FinancialView fallbackName={name} /> : <PortfolioView fallbackName={name} />;
}

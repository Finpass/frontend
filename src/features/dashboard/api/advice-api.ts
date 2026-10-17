import { http } from "@/lib/http";
import type { CompareResult, ProductsResult, SuitabilityRecord } from "@/features/dashboard/types";

type Signal = { signal?: AbortSignal };

export const adviceApi = {
  products: (o?: Signal) => http.get<ProductsResult>("/advice/products", o),
  compare: (symbols: string[], o?: Signal) => http.post<CompareResult>("/advice/compare", { symbols }, o),
  suitability: (o?: Signal) => http.get<{ items: SuitabilityRecord[] }>("/advice/suitability", o),
};

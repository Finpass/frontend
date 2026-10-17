import { http } from "@/lib/http";
import type { ProductsResult } from "@/features/dashboard/types";

export const adviceApi = {
  products: (o?: { signal?: AbortSignal }) => http.get<ProductsResult>("/advice/products", o),
};

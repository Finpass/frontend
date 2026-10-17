import { http } from "@/lib/http";
import { buildAssetParams, type DiscoverQuery } from "@/features/dashboard/lib/discover";
import type { DiscoverFacets, DiscoverPage } from "@/features/dashboard/types";

type Signal = { signal?: AbortSignal };

export const discoverApi = {
  assets: (q: DiscoverQuery, cursor?: string | null, o?: Signal) =>
    http.get<DiscoverPage>("/discover/assets", { params: buildAssetParams(q, cursor), ...o }),
  facets: (o?: Signal) => http.get<DiscoverFacets>("/discover/facets", o),
  star: (symbol: string) => http.put<null>(`/discover/watchlist/${encodeURIComponent(symbol)}`),
  unstar: (symbol: string) => http.delete<null>(`/discover/watchlist/${encodeURIComponent(symbol)}`),
};

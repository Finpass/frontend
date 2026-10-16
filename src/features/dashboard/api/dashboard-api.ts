import { http } from "@/lib/http";
import type {
  Article,
  AssetHit,
  BriefingPreview,
  CreateHoldingBody,
  HomeData,
  HomeRange,
  Holding,
  HoldingsResponse,
  NewsFilter,
  NewsPage,
  PortfolioData,
  PortfolioRange,
  UpdateHoldingBody,
  WhatsappSettings,
} from "@/features/dashboard/types";

type Signal = { signal?: AbortSignal };

export const dashboardApi = {
  home: (range: HomeRange, o?: Signal) => http.get<HomeData>("/dashboard/home", { params: { range }, ...o }),
  portfolio: (range: PortfolioRange, o?: Signal) => http.get<PortfolioData>("/dashboard/portfolio", { params: { range }, ...o }),
};

export const holdingsApi = {
  searchAssets: (q: string, limit = 8, o?: Signal) => http.get<AssetHit[]>("/assets/search", { params: { q, limit }, ...o }),
  list: () => http.get<HoldingsResponse>("/portfolio/holdings"),
  create: (body: CreateHoldingBody) => http.post<Holding>("/portfolio/holdings", body),
  update: (id: string, body: UpdateHoldingBody) => http.patch<Holding>(`/portfolio/holdings/${encodeURIComponent(id)}`, body),
  remove: (id: string) => http.delete<null>(`/portfolio/holdings/${encodeURIComponent(id)}`),
};

export const newsApi = {
  list: (p: { category: NewsFilter; q: string; cursor?: string | null; limit?: number }, o?: Signal) =>
    http.get<NewsPage>("/news", {
      params: { category: p.category, q: p.q || undefined, limit: p.limit ?? 20, cursor: p.cursor || undefined },
      ...o,
    }),
  bookmarks: () => http.get<Article[]>("/news/bookmarks"),
  bookmark: (id: string) => http.post<null>(`/news/${encodeURIComponent(id)}/bookmark`),
  unbookmark: (id: string) => http.delete<null>(`/news/${encodeURIComponent(id)}/bookmark`),
};

export const whatsappApi = {
  get: () => http.get<WhatsappSettings>("/whatsapp/settings"),
  save: (b: { phone: string; optIn: boolean; sendTimeLocal: string }) => http.put<WhatsappSettings>("/whatsapp/settings", b),
  verifyStart: () => http.post<unknown>("/whatsapp/verify/start"),
  verifyConfirm: (code: string) => http.post<unknown>("/whatsapp/verify/confirm", { code }),
  preview: (locale: "id" | "en") => http.get<BriefingPreview>("/briefing/preview", { params: { locale } }),
  sendTest: () => http.post<unknown>("/briefing/send-test"),
};

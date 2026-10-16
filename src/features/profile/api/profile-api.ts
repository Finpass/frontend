import { http } from "@/lib/http";
import type { Consent, ProfileState, Questionnaire, Result, SavePayload, SaveResponse } from "@/features/profile/types";

export const profileApi = {
  questionnaire: () => http.get<Questionnaire>("/profile/questionnaire"),
  get: () => http.get<ProfileState>("/profile"),
  consent: (whatsappOptIn: boolean) => http.post<Consent>("/profile/consent", { accepted: true, whatsappOptIn }),
  save: (payload: SavePayload) => http.put<SaveResponse>("/profile/answers", payload),
  submit: (lang: string) => http.post<Result>("/profile/submit", undefined, { headers: { "Accept-Language": lang } }),
  retake: () => http.post<unknown>("/profile/retake"),
  remove: () => http.delete<null>("/profile"),
};

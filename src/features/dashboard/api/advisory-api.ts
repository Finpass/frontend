import { http } from "@/lib/http";
import type { ChatReply, ChatSession, ChatSessionItem, TurnEvent } from "@/features/dashboard/types";

type Signal = { signal?: AbortSignal };

export const CHAT_TIMEOUT_MS = 70_000;

export const advisoryApi = {
  chat: (body: { sessionId?: string; message: string; lang: "id" | "en"; runId?: string }, o?: Signal) =>
    http.post<ChatReply>("/advisory/chat", body, { timeout: CHAT_TIMEOUT_MS, ...o }),
  turns: (runId: string, since: number, o?: Signal) =>
    http.get<{ items: TurnEvent[] }>(`/advisory/runs/${encodeURIComponent(runId)}/turns`, { params: { since }, ...o }),
  sessions: (o?: Signal) => http.get<{ items: ChatSessionItem[] }>("/advisory/sessions", o),
  session: (id: string, o?: Signal) => http.get<ChatSession>(`/advisory/sessions/${encodeURIComponent(id)}`, o),
  remove: (id: string) => http.delete<null>(`/advisory/sessions/${encodeURIComponent(id)}`),
};

"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { toApiError, userMessage } from "@/lib/api-error";
import { advisoryApi } from "@/features/dashboard/api/advisory-api";
import { DASH } from "@/features/dashboard/i18n";
import { useDash } from "@/features/dashboard/state/use-dash";
import type { ChatReply } from "@/features/dashboard/types";

type Copy = (typeof DASH)["id"]["adv"];

/** One question in flight (or just finished). It lives above the pages, so it keeps running when the user leaves the chat. */
export interface Run {
  runId: string;
  sessionId: string | null; // conversation the question was asked in; null for a new chat
  text: string;
  status: "running" | "done" | "failed";
  reply?: ChatReply;
  error?: string;
}

export interface StartArgs {
  sessionId: string | null;
  message: string;
  compare?: string[];
}

interface Ctx {
  run: Run | null;
  start: (a: StartArgs) => void;
  /**
   * The chat view says which conversation is on screen and who takes the result (viewing undefined = page closed).
   * A result for the conversation on screen goes to `onResult`; any other result becomes a toast.
   */
  attach: (viewing: string | null | undefined, onResult?: (r: Run) => void) => void;
  ack: () => void;
}

const RunsContext = createContext<Ctx | null>(null);

export function chatErrorText(e: unknown, a: Copy): string {
  const err = toApiError(e);
  if (err.status === 429) return a.rate;
  if (err.status === 502) return a.aiDown;
  return userMessage(err);
}

export function AdvisoryRunsProvider({ children }: { children: ReactNode }) {
  const { t, lang } = useDash();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const current = useRef<string | null>(null);
  const viewing = useRef<string | null | undefined>(undefined);
  const handler = useRef<((r: Run) => void) | undefined>(undefined);
  const copy = useRef(t.adv);
  const langRef = useRef(lang);
  useEffect(() => {
    copy.current = t.adv;
    langRef.current = lang;
  });

  const finish = useCallback(
    (r: Run) => {
      if (current.current !== r.runId) return; // a newer question replaced this one
      const a = copy.current;
      const v = viewing.current;
      if (v !== undefined && (v === r.sessionId || v === r.reply?.sessionId) && handler.current) {
        setRun(null);
        handler.current(r); // the chat view shows it itself
        return;
      }
      setRun(r);
      if (r.status === "failed") {
        toast.error(`${a.failToast} ${r.error ?? ""}`.trim());
        setRun(null);
        return;
      }
      const id = r.reply?.sessionId;
      toast.success(
        (tt) => (
          <span className="flex items-center gap-3">
            <span>{a.doneToast}</span>
            <button
              type="button"
              className="rounded-md border border-current px-2 py-0.5 text-xs font-semibold"
              onClick={() => {
                toast.dismiss(tt.id);
                router.push(`/dashboard/advisory?session=${id}`);
              }}
            >
              {a.openChat}
            </button>
          </span>
        ),
        { duration: 10_000 },
      );
    },
    [router],
  );

  const start = useCallback(
    (a: StartArgs) => {
      const runId = crypto.randomUUID();
      current.current = runId;
      const base = { runId, sessionId: a.sessionId, text: a.message };
      setRun({ ...base, status: "running" });
      advisoryApi
        .chat({ sessionId: a.sessionId ?? undefined, message: a.message, lang: langRef.current, runId, ...(a.compare && a.compare.length >= 2 && { compare: a.compare }) })
        .then(
          (reply) => finish({ ...base, status: "done", reply }),
          (e) => finish({ ...base, status: "failed", error: chatErrorText(e, copy.current) }),
        );
    },
    [finish],
  );

  const attach = useCallback((id: string | null | undefined, onResult?: (r: Run) => void) => {
    viewing.current = id;
    handler.current = onResult;
  }, []);
  const ack = useCallback(() => setRun(null), []);
  const value = useMemo(() => ({ run, start, attach, ack }), [run, start, attach, ack]);
  return <RunsContext.Provider value={value}>{children}</RunsContext.Provider>;
}

export function useAdvisoryRuns(): Ctx {
  const c = useContext(RunsContext);
  if (!c) throw new Error("useAdvisoryRuns must be used inside AdvisoryRunsProvider");
  return c;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "@/lib/api-error";
import { profileApi } from "@/features/profile/api/profile-api";
import { firstIncomplete, resumeIndex } from "@/features/profile/progress";
import type { AnswerValue, Answers, ProfileState, Questionnaire, Result } from "@/features/profile/types";
import { validateAll, type Issues } from "@/features/profile/validation";

export type Stage = "consent" | "wizard" | "result";
export type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

const DEBOUNCE_MS = 800;

export function useProfile(lang: string) {
  const [phase, setPhase] = useState<"loading" | "error" | "ready">("loading");
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [stage, setStage] = useState<Stage>("consent");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [optOut, setOptOut] = useState<string[]>([]);
  const [serverIssues, setServerIssues] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [result, setResult] = useState<Result | null>(null);

  const dirty = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const live = useRef({ answers, optOut });
  useEffect(() => {
    live.current = { answers, optOut };
  });
  const sections = questionnaire?.sections;

  const apply = useCallback((q: Questionnaire, p: ProfileState) => {
    setQuestionnaire(q);
    setProfile(p);
    setAnswers(p.answers ?? {});
    setOptOut(p.optOut ?? []);
    dirty.current.clear();
    if (p.status === "completed" && p.result) {
      setResult(p.result);
      setStage("result");
    } else {
      setStage(p.consent?.accepted ? "wizard" : "consent");
      setIndex(resumeIndex(q.sections, p.currentSection, p.answers ?? {}, p.optOut ?? []));
    }
    setPhase("ready");
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [q, p] = await Promise.all([profileApi.questionnaire(), profileApi.get()]);
      apply(q, p);
    } catch (e) {
      setLoadError(toApiError(e));
      setPhase("error");
    }
  }, [apply]);

  const load = useCallback(async () => {
    setPhase("loading");
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    // state is only set after the awaited fetch, the rule cannot see that through the callback
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  const flush = useCallback(
    async (sectionId?: string): Promise<boolean> => {
      clearTimeout(timer.current);
      const keys = [...dirty.current];
      if (keys.length === 0 && !sectionId) return true;
      const { answers: a, optOut: o } = live.current;
      const payload: Record<string, AnswerValue | null> = {};
      for (const k of keys) payload[k] = a[k] ?? null;
      setSaveState("saving");
      try {
        await profileApi.save({ section: sectionId, answers: payload, optOut: o });
        for (const k of keys) dirty.current.delete(k);
        setSaveState("saved");
        return true;
      } catch (e) {
        const err = toApiError(e);
        if (err.status === 422) setServerIssues((s) => ({ ...s, ...err.fieldErrors() }));
        setSaveState(err.code === "NETWORK" ? "offline" : "error");
        return false;
      }
    },
    [],
  );

  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // retry the pending save once the connection returns
  useEffect(() => {
    const on = () => dirty.current.size > 0 && void flush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [flush]);

  const setAnswer = useCallback(
    (qid: string, value: AnswerValue | undefined) => {
      setAnswers((a) => {
        const next = { ...a };
        if (value === undefined) delete next[qid];
        else next[qid] = value;
        return next;
      });
      setServerIssues((s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== qid)));
      dirty.current.add(qid);
      schedule();
    },
    [schedule],
  );

  const setOptedOut = useCallback(
    (qid: string, on: boolean) => {
      setOptOut((o) => (on ? [...new Set([...o, qid])] : o.filter((x) => x !== qid)));
      if (on) setAnswer(qid, undefined);
      else {
        dirty.current.add(qid);
        schedule();
      }
    },
    [setAnswer, schedule],
  );

  const goTo = useCallback(
    async (i: number) => {
      if (!sections) return;
      const target = Math.min(Math.max(i, 0), sections.length - 1);
      setIndex(target);
      void flush(sections[target].id);
    },
    [sections, flush],
  );

  const acceptConsent = useCallback(
    async (whatsappOptIn: boolean) => {
      const consent = await profileApi.consent(whatsappOptIn);
      setProfile((p) => (p ? { ...p, consent } : p));
      setStage("wizard");
    },
    [],
  );

  const submit = useCallback(async (): Promise<{ issues?: Issues[]; error?: ApiError }> => {
    if (!sections) return {};
    const issues = validateAll(sections, live.current.answers, live.current.optOut);
    const bad = firstIncomplete(sections, live.current.answers, live.current.optOut);
    if (bad !== -1) return { issues };
    if (!(await flush(sections[sections.length - 1].id))) return { error: new ApiError("NETWORK", "save failed", 0) };
    try {
      const r = await profileApi.submit(lang);
      setResult(r);
      setProfile((p) => (p ? { ...p, status: "completed", result: r } : p));
      setStage("result");
      return {};
    } catch (e) {
      const err = toApiError(e);
      if (err.status === 422) setServerIssues((s) => ({ ...s, ...err.fieldErrors() }));
      return { error: err };
    }
  }, [sections, flush, lang]);

  const retake = useCallback(async () => {
    await profileApi.retake();
    await load();
  }, [load]);

  const remove = useCallback(async () => {
    await profileApi.remove();
    await load();
  }, [load]);

  return {
    phase, loadError, load, questionnaire, profile, stage, index, answers, optOut, serverIssues, saveState, result,
    setAnswer, setOptedOut, goTo, flush, acceptConsent, submit, retake, remove,
  };
}

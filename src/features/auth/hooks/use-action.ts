"use client";

import { useCallback, useState } from "react";
import { toApiError, userMessage, type ApiError } from "@/lib/api-error";

/** Runs an async call, tracking pending state and a user-facing error; `onError` may claim the error. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async <T,>(fn: () => Promise<T>, onError?: (e: ApiError) => boolean): Promise<T | undefined> => {
    setPending(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      const err = toApiError(e);
      if (!onError?.(err)) setError(userMessage(err));
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, setError, run };
}

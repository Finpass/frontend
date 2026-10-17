"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setAccessTokenGetter } from "@/lib/http";
import { authApi } from "@/features/auth/api/auth-api";
import { AuthModal } from "@/features/auth/components/auth-modal";
import type { AuthUser, AuthView, Session } from "@/features/auth/types";

type Status = "loading" | "guest" | "authed";

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  openAuth: (view?: AuthView) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_MARGIN_MS = 60_000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [modal, setModal] = useState<AuthView | null>(null);
  const token = useRef<string | null>(null);
  const router = useRouter();

  const apply = useCallback((s: Session | null) => {
    token.current = s?.accessToken ?? null;
    setSession(s);
    setStatus(s ? "authed" : "guest");
  }, []);

  useEffect(() => {
    setAccessTokenGetter(() => token.current);
    // a second attempt covers another tab rotating the cookie at the same moment
    authApi
      .refresh()
      .catch(() => wait(400).then(() => authApi.refresh()))
      .then(apply, () => apply(null));
  }, [apply]);

  const expiresAt = session?.accessExpiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    const delay = Math.max(new Date(expiresAt).getTime() - Date.now() - REFRESH_MARGIN_MS, 5_000);
    const id = setTimeout(() => authApi.refresh().then(apply, () => apply(null)), delay);
    return () => clearTimeout(id);
  }, [expiresAt, apply]);

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    apply(null);
    toast.success("Signed out");
  }, [apply]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, openAuth: (v = "login") => setModal(v), signOut }),
    [status, session, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal && (
        <AuthModal
          initialView={modal}
          onClose={() => setModal(null)}
          onAuthed={(s) => {
            apply(s);
            setModal(null);
            router.push("/dashboard");
            toast.success(`Welcome, ${s.user.name}`);
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

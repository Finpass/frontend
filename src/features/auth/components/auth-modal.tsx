"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AuthView, Session } from "@/features/auth/types";
import { ForgotForm } from "./forgot-form";
import { CloseIcon } from "./icons";
import { LoginForm } from "./login-form";
import { OtpForm } from "./otp-form";
import { RegisterForm } from "./register-form";

interface Props {
  initialView: AuthView;
  onClose: () => void;
  onAuthed: (s: Session) => void;
}

export function AuthModal({ initialView, onClose, onAuthed }: Props) {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "reset">("request");
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const needVerify = (e: string) => {
    setEmail(e);
    setView("verify");
  };

  const heading: Record<AuthView, [string, string]> = {
    login: ["Welcome back", "Sign in to follow your portfolio and your daily AI briefing."],
    register: ["Create your account", "Start your daily financial briefing in a few minutes."],
    verify: ["Check your email", `Enter the 6-digit code we sent to ${email}.`],
    forgot: [
      resetStep === "request" ? "Forgot your password?" : "Set a new password",
      resetStep === "request" ? "Enter your email and we will send you a reset code." : "Enter the code from your email and choose a new password.",
    ],
  };
  const [title, subtitle] = heading[view];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} aria-hidden />
      <motion.div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative max-h-[94vh] w-full max-w-[680px] overflow-y-auto rounded-3xl border border-stroke bg-surface font-app shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] outline-none"
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 rounded-full p-2 text-ink/60 hover:bg-ink/10 hover:text-ink">
          <CloseIcon className="h-5 w-5" />
        </button>
        <div className="mx-auto w-full max-w-[520px] px-6 py-14 sm:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={view} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}>
              <h2 id="auth-title" className="text-3xl font-bold tracking-tight">{title}</h2>
              <p className="mb-8 mt-2 text-ink/70">{subtitle}</p>
              {view === "login" && <LoginForm onSession={onAuthed} onSwitch={setView} onNeedVerify={needVerify} />}
              {view === "register" && <RegisterForm onSession={onAuthed} onSwitch={setView} onNeedVerify={needVerify} />}
              {view === "verify" && <OtpForm email={email} onSession={onAuthed} onSwitch={setView} />}
              {view === "forgot" && <ForgotForm onSwitch={(v) => { setResetStep("request"); setView(v); }} onStep={setResetStep} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

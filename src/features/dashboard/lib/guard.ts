export type AuthStatus = "loading" | "guest" | "authed";
export type ProfileGate = "loading" | "none" | "draft" | "completed" | "error";
export type GuardResult = "loading" | "signin" | "onboarding" | "error" | "ok";

/** Decides what the dashboard shell renders before any dashboard data is requested. */
export function guardDecision(auth: AuthStatus, profile: ProfileGate): GuardResult {
  if (auth === "loading") return "loading";
  if (auth === "guest") return "signin";
  if (profile === "loading") return "loading";
  if (profile === "error") return "error";
  return profile === "completed" ? "ok" : "onboarding";
}

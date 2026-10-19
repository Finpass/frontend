import { http } from "@/lib/http";
import type { AuthUser, LoginInput, RegisterInput, ResetInput, Session } from "@/features/auth/types";

let refreshing: Promise<Session> | null = null;

export const authApi = {
  register: (input: RegisterInput) => http.post<{ email: string }>("/auth/register", input),
  verifyEmail: (email: string, code: string) => http.post<Session>("/auth/verify-email", { email, code }),
  resendOtp: (email: string) => http.post<null>("/auth/resend-otp", { email }),
  login: (input: LoginInput) => http.post<Session>("/auth/login", input),
  google: (accessToken: string) => http.post<Session>("/auth/google", { accessToken }),
  forgotPassword: (email: string) => http.post<null>("/auth/forgot-password", { email }),
  resetPassword: (input: ResetInput) => http.post<null>("/auth/reset-password", input),
  logout: () => http.post<null>("/auth/logout"),
  exportData: () => http.get<Record<string, unknown>>("/auth/export"),
  deleteAccount: (password: string) => http.delete<null>("/auth/account", { data: { password, confirm: "DELETE" } }),
  me: () => http.get<AuthUser>("/auth/me"),
  // single-flight: parallel callers (StrictMode, several tabs) must not race the rotating cookie
  refresh: () => (refreshing ??= http.post<Session>("/auth/refresh").finally(() => (refreshing = null))),
};

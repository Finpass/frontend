export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
  accessExpiresAt: string;
}

export type AuthView = "login" | "register" | "verify" | "forgot";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetInput {
  email: string;
  code: string;
  newPassword: string;
}

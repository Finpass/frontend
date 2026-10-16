export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateName = (v: string) => (v.trim().length === 0 || v.trim().length > 80 ? "Enter your name (max 80 characters)" : "");

export const validateEmail = (v: string) => (EMAIL_RE.test(v.trim()) && v.trim().length <= 254 ? "" : "Enter a valid email address");

export function validatePassword(v: string) {
  const ok = v.length >= 8 && v.length <= 72 && /[A-Za-z]/.test(v) && /\d/.test(v);
  return ok ? "" : "Use 8-72 characters with at least one letter and one digit";
}

export const validateCode = (v: string) => (/^\d{6}$/.test(v) ? "" : "Enter the 6-digit code");

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL"
  | "UPSTREAM_FAILED"
  | "UNAVAILABLE"
  | "UPSTREAM_TIMEOUT";

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: ErrorCode; message: string; details: ErrorDetail[] };
  requestId?: string;
}

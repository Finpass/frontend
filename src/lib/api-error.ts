import { isAxiosError } from "axios";
import type { ApiFailure, ErrorCode, ErrorDetail } from "@/types/api";

export type ClientErrorCode = ErrorCode | "NETWORK" | "UNKNOWN";

export class ApiError extends Error {
  constructor(
    readonly code: ClientErrorCode,
    message: string,
    readonly status: number,
    readonly details: ErrorDetail[] = [],
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isServerFault(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      this.details.filter((d) => d.field).map((d) => [d.field as string, d.message]),
    );
  }
}

function isFailure(body: unknown): body is ApiFailure {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as ApiFailure).success === false &&
    typeof (body as ApiFailure).error?.code === "string"
  );
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (isAxiosError(err)) {
    if (!err.response) {
      return new ApiError("NETWORK", "Tidak dapat terhubung ke server. Periksa koneksi internetmu.", 0);
    }
    const { status, data } = err.response;
    if (isFailure(data)) {
      return new ApiError(data.error.code, data.error.message, status, data.error.details, data.requestId);
    }
    return new ApiError("UNKNOWN", err.message, status);
  }
  return new ApiError("UNKNOWN", err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.", 500);
}

export function userMessage(err: ApiError): string {
  if (err.code === "NETWORK") return err.message;
  if (err.isServerFault) {
    const ref = err.requestId ? ` (ref: ${err.requestId})` : "";
    return `Terjadi kesalahan di server. Coba lagi sebentar lagi.${ref}`;
  }
  return err.message;
}

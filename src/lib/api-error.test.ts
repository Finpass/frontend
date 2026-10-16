import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, toApiError, userMessage } from "./api-error";

function axiosErr(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("fail", "ERR", config, null, {
    status,
    data,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse);
}

describe("toApiError", () => {
  it("maps the backend envelope", () => {
    const e = toApiError(
      axiosErr(422, {
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Validation failed", details: [{ field: "title", message: "required" }] },
        requestId: "r1",
      }),
    );
    expect(e.code).toBe("VALIDATION_FAILED");
    expect(e.status).toBe(422);
    expect(e.requestId).toBe("r1");
    expect(e.fieldErrors()).toEqual({ title: "required" });
    expect(userMessage(e)).toBe("Validation failed");
  });

  it("treats a missing response as a network error", () => {
    const e = toApiError(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(e.code).toBe("NETWORK");
    expect(e.isServerFault).toBe(true);
  });

  it("falls back to UNKNOWN for non-envelope bodies", () => {
    expect(toApiError(axiosErr(502, "<html>bad gateway</html>")).code).toBe("UNKNOWN");
  });

  it("hides server detail and shows the request id on 5xx", () => {
    const e = new ApiError("INTERNAL", "stack trace here", 500, [], "abc");
    expect(userMessage(e)).toContain("ref: abc");
    expect(userMessage(e)).not.toContain("stack trace");
  });
});

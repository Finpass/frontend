import { describe, expect, it } from "vitest";
import { validateCode, validateEmail, validatePassword } from "./validation";

describe("auth validation", () => {
  it("accepts and rejects emails", () => {
    expect(validateEmail(" a@b.co ")).toBe("");
    expect(validateEmail("nope")).not.toBe("");
  });

  it("mirrors the backend password policy", () => {
    expect(validatePassword("goodpass1")).toBe("");
    for (const bad of ["short1", "onlyletters", "12345678"]) expect(validatePassword(bad)).not.toBe("");
  });

  it("requires exactly six digits", () => {
    expect(validateCode("123456")).toBe("");
    expect(validateCode("12345")).not.toBe("");
    expect(validateCode("12a456")).not.toBe("");
  });
});

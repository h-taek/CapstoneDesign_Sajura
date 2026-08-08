import { describe, expect, it } from "vitest";
import {
  formatBusinessNo,
  loginSchema,
  registerSchema,
  verifyBusinessSchema,
} from "../schemas/auth";

describe("formatBusinessNo", () => {
  it("masks 10 digits to NNN-NN-NNNNN", () => {
    expect(formatBusinessNo("1234567890")).toBe("123-45-67890");
  });
  it("masks partial input progressively", () => {
    expect(formatBusinessNo("12")).toBe("12");
    expect(formatBusinessNo("1234")).toBe("123-4");
    expect(formatBusinessNo("123456")).toBe("123-45-6");
  });
  it("strips non digits and caps at 10", () => {
    expect(formatBusinessNo("123-45-67890999")).toBe("123-45-67890");
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("rejects bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "owner@example.com",
    password: "supersecret",
    password_confirm: "supersecret",
    name: "홍길동",
  };
  it("accepts valid input (email·password·name only)", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects password shorter than 8", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "123", password_confirm: "123" }).success,
    ).toBe(false);
  });
  it("rejects mismatched password confirm", () => {
    expect(registerSchema.safeParse({ ...valid, password_confirm: "different" }).success).toBe(
      false,
    );
  });
});

describe("verifyBusinessSchema", () => {
  it("accepts well-formed business_no", () => {
    expect(verifyBusinessSchema.safeParse({ business_no: "123-45-67890" }).success).toBe(true);
  });
  it("rejects malformed business_no", () => {
    expect(verifyBusinessSchema.safeParse({ business_no: "12345" }).success).toBe(false);
  });
});

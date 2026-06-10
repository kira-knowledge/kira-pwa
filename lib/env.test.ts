import { describe, it, expect, afterEach } from "vitest";
import { requiredEnv } from "./env";

describe("requiredEnv", () => {
  afterEach(() => {
    delete process.env.KIRA_TEST_VAR;
  });

  it("returns the value when set", () => {
    process.env.KIRA_TEST_VAR = "hello";
    expect(requiredEnv("KIRA_TEST_VAR")).toBe("hello");
  });

  it("throws a clear error when missing or empty", () => {
    expect(() => requiredEnv("KIRA_TEST_VAR")).toThrow(
      "KIRA_TEST_VAR not configured"
    );
    process.env.KIRA_TEST_VAR = "";
    expect(() => requiredEnv("KIRA_TEST_VAR")).toThrow(
      "KIRA_TEST_VAR not configured"
    );
  });
});

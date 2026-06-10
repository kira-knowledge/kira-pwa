import { describe, it, expect } from "vitest";
import { shouldShowSplash } from "./splash";

describe("shouldShowSplash", () => {
  it("shows on first visit to a normal page", () => {
    expect(shouldShowSplash("/", null)).toBe(true);
    expect(shouldShowSplash("/login", null)).toBe(true);
  });
  it("never shows on the share target (must not delay ingest)", () => {
    expect(shouldShowSplash("/share", null)).toBe(false);
    expect(shouldShowSplash("/share?url=x", null)).toBe(false);
  });
  it("shows only once per session", () => {
    expect(shouldShowSplash("/", "1")).toBe(false);
  });
});

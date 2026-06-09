import { describe, it, expect } from "vitest";
import { planFromProfile } from "./auth";

describe("planFromProfile", () => {
  it("returns 'pro' only for an explicit pro plan", () => {
    expect(planFromProfile({ plan: "pro" })).toBe("pro");
  });
  it("defaults to 'free' for free, missing, null, or junk", () => {
    expect(planFromProfile({ plan: "free" })).toBe("free");
    expect(planFromProfile({})).toBe("free");
    expect(planFromProfile(null)).toBe("free");
    expect(planFromProfile(undefined)).toBe("free");
    expect(planFromProfile({ plan: "enterprise" })).toBe("free");
  });
});

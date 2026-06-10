import { describe, it, expect } from "vitest";
import { goDeeperButton } from "./goDeeper";

describe("goDeeperButton", () => {
  it("pro users run the web search", () => {
    expect(goDeeperButton("pro")).toEqual({ label: "Go Deeper", action: "deepen" });
  });
  it("free users are sent to upgrade", () => {
    expect(goDeeperButton("free")).toEqual({
      label: "Go Deeper • Get it with PRO",
      action: "upgrade",
    });
  });
});

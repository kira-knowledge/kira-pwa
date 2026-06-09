import { describe, it, expect } from "vitest";
import { extractInstagramUrl } from "./shareUrl";

describe("extractInstagramUrl", () => {
  it("pulls a reel url out of shared text", () => {
    expect(extractInstagramUrl("look https://www.instagram.com/reel/ABC/?igsh=1 nice"))
      .toBe("https://www.instagram.com/reel/ABC/?igsh=1");
  });
  it("returns null when there is no instagram link", () => {
    expect(extractInstagramUrl("just some text https://example.com")).toBeNull();
  });
  it("returns null for empty input", () => {
    expect(extractInstagramUrl("")).toBeNull();
  });
});

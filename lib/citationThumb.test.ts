import { describe, it, expect } from "vitest";
import { citationThumbSrc, shortcodeFromUrl } from "./citationThumb";

describe("shortcodeFromUrl", () => {
  it("extracts the shortcode from reel/p/tv urls with tracking params", () => {
    expect(shortcodeFromUrl("https://www.instagram.com/reel/DZSYdRYo0dD/?igsh=x")).toBe("DZSYdRYo0dD");
    expect(shortcodeFromUrl("https://www.instagram.com/p/C-uAmf3R8sW/")).toBe("C-uAmf3R8sW");
    expect(shortcodeFromUrl("https://www.instagram.com/tv/AbC123/")).toBe("AbC123");
  });
  it("returns empty for non-post urls", () => {
    expect(shortcodeFromUrl("https://example.com/article")).toBe("");
    expect(shortcodeFromUrl("")).toBe("");
  });
});

describe("citationThumbSrc", () => {
  it("builds the proxy URL from the source url", () => {
    expect(citationThumbSrc("https://www.instagram.com/reel/DZSYdRYo0dD/?igsh=x")).toBe(
      "/api/thumb/DZSYdRYo0dD"
    );
  });
  it("is empty when no shortcode exists", () => {
    expect(citationThumbSrc("https://example.com/x")).toBe("");
  });
});

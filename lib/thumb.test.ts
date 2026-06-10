import { describe, expect, it } from "vitest";
import { thumbSrc } from "./thumb";

describe("thumbSrc", () => {
  it("builds the proxy URL when thumb_key is set", () => {
    expect(thumbSrc({ id: "ABC123", thumb_key: "thumbs/ABC123.jpg" })).toBe(
      "/api/thumb/ABC123"
    );
  });

  it("returns empty string when thumb_key is missing or empty", () => {
    expect(thumbSrc({ id: "ABC123" })).toBe("");
    expect(thumbSrc({ id: "ABC123", thumb_key: "" })).toBe("");
  });

  it("URL-encodes the id", () => {
    expect(thumbSrc({ id: "a/b", thumb_key: "k" })).toBe("/api/thumb/a%2Fb");
  });
});

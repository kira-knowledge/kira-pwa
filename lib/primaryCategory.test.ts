import { describe, it, expect } from "vitest";
import { primaryCategory } from "./primaryCategory";

const themes = [
  { name: "Travel", source_urls: ["a", "b"] },
  { name: "Food", source_urls: ["c"] },
];

describe("primaryCategory", () => {
  it("returns the name of the first theme containing the url", () => {
    expect(primaryCategory(themes, "c")).toBe("Food");
  });
  it("returns the first match when several themes contain the url", () => {
    const t = [
      { name: "X", source_urls: ["a"] },
      { name: "Y", source_urls: ["a"] },
    ];
    expect(primaryCategory(t, "a")).toBe("X");
  });
  it("returns null when no theme contains the url", () => {
    expect(primaryCategory(themes, "zzz")).toBeNull();
  });
  it("returns null for empty themes", () => {
    expect(primaryCategory([], "a")).toBeNull();
  });
  it("tolerates a theme with no source_urls", () => {
    expect(primaryCategory([{ name: "Z" }], "a")).toBeNull();
  });
});

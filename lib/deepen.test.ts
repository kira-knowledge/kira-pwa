import { describe, it, expect } from "vitest";
import { parseDeepenResponse } from "./deepen";

describe("parseDeepenResponse", () => {
  it("passes through a well-formed response", () => {
    const out = parseDeepenResponse({
      synthesis: "hi [1]",
      results: [{ n: 1, title: "T", url: "u", site: "s", snippet: "x", published_date: "2025" }],
    });
    expect(out.synthesis).toBe("hi [1]");
    expect(out.results).toHaveLength(1);
    expect(out.results[0].url).toBe("u");
    expect(out.results[0].site).toBe("s");
  });

  it("defaults missing results to an empty array", () => {
    expect(parseDeepenResponse({ synthesis: "" }).results).toEqual([]);
    expect(parseDeepenResponse({}).results).toEqual([]);
    expect(parseDeepenResponse(null).results).toEqual([]);
  });

  it("defaults a missing synthesis to an empty string", () => {
    expect(parseDeepenResponse({ results: [] }).synthesis).toBe("");
  });

  it("numbers results positionally when n is absent", () => {
    const out = parseDeepenResponse({ results: [{ title: "A" }, { title: "B" }] });
    expect(out.results.map((r) => r.n)).toEqual([1, 2]);
  });

  it("falls back to positional n when n is a non-number", () => {
    const out = parseDeepenResponse({ results: [{ n: "bad", title: "X" }, { n: null, title: "Y" }] });
    expect(out.results.map((r) => r.n)).toEqual([1, 2]);
  });
});

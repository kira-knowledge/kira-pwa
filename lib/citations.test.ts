import { describe, it, expect } from "vitest";
import { splitCitations } from "./citations";
import { Citation } from "./chatHistory";

const cite = (n: number): Citation => ({
  n, title: `T${n}`, author: "a", thumbnail: "", source_url: `u${n}`,
});

describe("splitCitations", () => {
  it("attaches citations to known markers", () => {
    const segs = splitCitations("Hello [1] world [2].", [cite(1), cite(2)]);
    expect(segs.filter((s) => s.citation).map((s) => s.citation!.n)).toEqual([1, 2]);
  });

  it("keeps plain text between markers", () => {
    const segs = splitCitations("a [1] b", [cite(1)]);
    expect(segs.map((s) => s.text)).toEqual(["a ", "[1]", " b"]);
  });

  it("renders unknown markers as plain text (no citation)", () => {
    const segs = splitCitations("x [9] y", [cite(1)]);
    expect(segs.find((s) => s.text === "[9]")?.citation).toBeUndefined();
  });
});

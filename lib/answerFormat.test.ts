import { describe, it, expect } from "vitest";
import { parseAnswerBlocks } from "./answerFormat";

describe("parseAnswerBlocks", () => {
  it("splits an intro paragraph from a numbered list", () => {
    const blocks = parseAnswerBlocks("Here is the gist.\n1. First point [1]\n2. Second point [2]");
    expect(blocks).toEqual([
      { type: "para", text: "Here is the gist." },
      { type: "list", ordered: true, items: ["First point [1]", "Second point [2]"] },
    ]);
  });
  it("parses bullet lists as unordered", () => {
    expect(parseAnswerBlocks("- one\n- two")).toEqual([
      { type: "list", ordered: false, items: ["one", "two"] },
    ]);
  });
  it("treats plain lines as paragraphs", () => {
    expect(parseAnswerBlocks("just a sentence")).toEqual([
      { type: "para", text: "just a sentence" },
    ]);
  });
  it("starts a new list when the marker style changes", () => {
    expect(parseAnswerBlocks("1. a\n- b")).toEqual([
      { type: "list", ordered: true, items: ["a"] },
      { type: "list", ordered: false, items: ["b"] },
    ]);
  });
  it("keeps citation markers in the item text", () => {
    expect(parseAnswerBlocks("1. point [3]")).toEqual([
      { type: "list", ordered: true, items: ["point [3]"] },
    ]);
  });
  it("returns an empty array for empty input", () => {
    expect(parseAnswerBlocks("")).toEqual([]);
  });
});

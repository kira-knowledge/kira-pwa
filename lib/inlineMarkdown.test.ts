import { describe, it, expect } from "vitest";
import { parseInline } from "./inlineMarkdown";

describe("parseInline", () => {
  it("returns plain text as a single span", () => {
    expect(parseInline("just a sentence")).toEqual([{ text: "just a sentence" }]);
  });
  it("parses **bold** into a bold span", () => {
    expect(parseInline("a **key term** here")).toEqual([
      { text: "a " },
      { text: "key term", bold: true },
      { text: " here" },
    ]);
  });
  it("keeps citation markers inside bold spans", () => {
    expect(parseInline("**Key point [1]**")).toEqual([
      { text: "Key point [1]", bold: true },
    ]);
  });
  it("parses *italic* into an italic span", () => {
    expect(parseInline("an *emphasis* word")).toEqual([
      { text: "an " },
      { text: "emphasis", italic: true },
      { text: " word" },
    ]);
  });
  it("parses `code` into a code span", () => {
    expect(parseInline("run `npm test` now")).toEqual([
      { text: "run " },
      { text: "npm test", code: true },
      { text: " now" },
    ]);
  });
  it("handles multiple bold spans in one line", () => {
    expect(parseInline("**a** and **b**")).toEqual([
      { text: "a", bold: true },
      { text: " and " },
      { text: "b", bold: true },
    ]);
  });
  it("leaves unclosed markers as literal text", () => {
    expect(parseInline("a ** dangling")).toEqual([{ text: "a ** dangling" }]);
  });
  it("does not treat spaced asterisks as italic", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ text: "2 * 3 * 4" }]);
  });
  it("keeps citation markers inside italic spans", () => {
    expect(parseInline("*Key point [1]*")).toEqual([
      { text: "Key point [1]", italic: true },
    ]);
  });
  it("returns an empty array for empty input", () => {
    expect(parseInline("")).toEqual([]);
  });
});

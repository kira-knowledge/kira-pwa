import { describe, it, expect } from "vitest";
import {
  EditState, setSummary, setInsight, addInsight, removeInsight,
  addTag, removeTag, toPatch,
} from "./postEdit";

const base: EditState = { summary: "s", key_insights: ["a", "b"], tags: ["x"] };

describe("postEdit reducers (immutable)", () => {
  it("setSummary returns a new object", () => {
    const out = setSummary(base, "new");
    expect(out.summary).toBe("new");
    expect(base.summary).toBe("s");
  });
  it("setInsight edits one bullet immutably", () => {
    const out = setInsight(base, 1, "B2");
    expect(out.key_insights).toEqual(["a", "B2"]);
    expect(base.key_insights).toEqual(["a", "b"]);
  });
  it("addInsight appends a blank bullet", () => {
    expect(addInsight(base).key_insights).toEqual(["a", "b", ""]);
  });
  it("removeInsight drops the index", () => {
    expect(removeInsight(base, 0).key_insights).toEqual(["b"]);
  });
  it("addTag trims, ignores blanks and duplicates", () => {
    expect(addTag(base, "  y ").tags).toEqual(["x", "y"]);
    expect(addTag(base, "x").tags).toEqual(["x"]);
    expect(addTag(base, "   ")).toBe(base);
  });
  it("removeTag drops the tag", () => {
    expect(removeTag(base, "x").tags).toEqual([]);
  });
  it("toPatch trims summary, drops blank insights, keeps tags", () => {
    const dirty: EditState = { summary: " hi ", key_insights: ["a", "  ", ""], tags: ["t"] };
    expect(toPatch(dirty)).toEqual({ summary: "hi", key_insights: ["a"], tags: ["t"] });
  });
});

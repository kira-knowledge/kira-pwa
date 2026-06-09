import { describe, it, expect } from "vitest";
import { filterByCategory } from "./categoryFilter";

const items = [
  { source_url: "a", title: "A" },
  { source_url: "b", title: "B" },
  { source_url: "c", title: "C" },
];

describe("filterByCategory", () => {
  it("keeps only items whose source_url is in the set, preserving item order", () => {
    expect(filterByCategory(items, ["c", "a"]).map((i) => i.title)).toEqual(["A", "C"]);
  });
  it("returns empty for an empty url set", () => {
    expect(filterByCategory(items, [])).toEqual([]);
  });
  it("ignores urls with no matching item", () => {
    expect(filterByCategory(items, ["zzz"])).toEqual([]);
  });
  it("does not mutate the input", () => {
    const copy = [...items];
    filterByCategory(items, ["a"]);
    expect(items).toEqual(copy);
  });
});

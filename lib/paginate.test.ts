import { describe, it, expect } from "vitest";
import { paginate } from "./paginate";

const nums = Array.from({ length: 25 }, (_, i) => i + 1);

describe("paginate", () => {
  it("returns the first 10 on page 1", () => {
    const r = paginate(nums, 1, 10);
    expect(r.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.pageCount).toBe(3);
    expect(r.page).toBe(1);
  });
  it("returns the partial last page", () => {
    const r = paginate(nums, 3, 10);
    expect(r.pageItems).toEqual([21, 22, 23, 24, 25]);
    expect(r.page).toBe(3);
  });
  it("clamps an out-of-range page into range", () => {
    expect(paginate(nums, 99, 10).page).toBe(3);
    expect(paginate(nums, 0, 10).page).toBe(1);
  });
  it("handles an empty list with one empty page", () => {
    const r = paginate<number>([], 1, 10);
    expect(r.pageItems).toEqual([]);
    expect(r.pageCount).toBe(1);
    expect(r.page).toBe(1);
  });
  it("does not mutate the input", () => {
    const copy = [...nums];
    paginate(nums, 2, 10);
    expect(nums).toEqual(copy);
  });
});

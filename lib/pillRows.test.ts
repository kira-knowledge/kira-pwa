import { describe, expect, it } from "vitest";
import { maxPillsForRows } from "./pillRows";

// Container 100 wide, gap 10: two 45-wide pills fit per row (45+10+45=100).
const GAP = 10;
const CW = 100;

describe("maxPillsForRows", () => {
  it("shows all pills when they fit within the row cap", () => {
    // 3 pills + More = 4 × 45 → 2 rows
    expect(maxPillsForRows([45, 45, 45], 45, CW, GAP, 3)).toBe(3);
  });

  it("drops trailing pills so More fits on the last allowed row", () => {
    // 7 pills + More = 8 × 45 → 4 rows; cap 3 rows → 5 pills + More = 3 rows
    expect(maxPillsForRows([45, 45, 45, 45, 45, 45, 45], 45, CW, GAP, 3)).toBe(5);
  });

  it("handles pills wider than the container (one per row)", () => {
    // Each 120-wide pill takes a full row; 3 rows → 2 pills + More
    expect(maxPillsForRows([120, 120, 120, 120], 120, CW, GAP, 3)).toBe(2);
  });

  it("returns 0 when only More fits", () => {
    expect(maxPillsForRows([120, 120], 120, CW, GAP, 1)).toBe(0);
  });

  it("falls back to all pills when container width is unmeasurable", () => {
    expect(maxPillsForRows([45, 45, 45, 45], 45, 0, GAP, 3)).toBe(4);
  });

  it("handles an empty theme list", () => {
    expect(maxPillsForRows([], 45, CW, GAP, 3)).toBe(0);
  });

  it("packs mixed widths greedily like flex-wrap", () => {
    // Row1: 60+10+30=100; Row2: 80; Row3: 50+10+40(More)=100 → 4 pills, 3 rows
    expect(maxPillsForRows([60, 30, 80, 50], 40, CW, GAP, 3)).toBe(4);
  });
});

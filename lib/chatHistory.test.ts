import { describe, it, expect } from "vitest";
import { capHistory, pickById, ChatRecord } from "./chatHistory";

function rec(id: string): ChatRecord {
  return { id, question: id, answer: "", citations: [], suggested: [], grounded_by: "dify", ts: 0 };
}

describe("capHistory", () => {
  it("prepends the newest record", () => {
    const out = capHistory([rec("a")], rec("b"));
    expect(out.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("caps at 10, dropping the oldest", () => {
    const start = Array.from({ length: 10 }, (_, i) => rec(`r${i}`));
    const out = capHistory(start, rec("new"));
    expect(out).toHaveLength(10);
    expect(out[0].id).toBe("new");
    expect(out.some((r) => r.id === "r9")).toBe(false); // oldest dropped
  });

  it("does not mutate the input array", () => {
    const start = [rec("a")];
    capHistory(start, rec("b"));
    expect(start.map((r) => r.id)).toEqual(["a"]);
  });
});

describe("pickById", () => {
  it("returns the matching record", () => {
    expect(pickById([rec("a"), rec("b")], "b")?.id).toBe("b");
  });
  it("returns null when not found", () => {
    expect(pickById([rec("a")], "zzz")).toBeNull();
  });
});

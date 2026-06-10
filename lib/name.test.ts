import { describe, it, expect } from "vitest";
import { firstNameFrom } from "./name";

describe("firstNameFrom", () => {
  it("uses the first word of full_name", () => {
    expect(firstNameFrom("Ada Lovelace", "ada@x.com")).toBe("Ada");
  });
  it("falls back to the email local part, capitalized", () => {
    expect(firstNameFrom(undefined, "free@kira.demo")).toBe("Free");
  });
  it("falls back to null with no data", () => {
    expect(firstNameFrom(undefined, undefined)).toBeNull();
  });
});

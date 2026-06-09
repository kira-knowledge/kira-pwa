import { describe, it, expect } from "vitest";
import { isPublicPath, isApiPath } from "./authPaths";

describe("isPublicPath", () => {
  it("treats /login (and subpaths) as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/whatever")).toBe(true);
  });
  it("treats app pages as non-public", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/chat")).toBe(false);
    expect(isPublicPath("/share")).toBe(false);
  });
});

describe("isApiPath", () => {
  it("matches /api/* only", () => {
    expect(isApiPath("/api/chat")).toBe(true);
    expect(isApiPath("/api/deepen")).toBe(true);
    expect(isApiPath("/chat")).toBe(false);
    expect(isApiPath("/")).toBe(false);
  });
});

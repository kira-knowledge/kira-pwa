// Paths reachable without a session. Everything else is gated.
const PUBLIC_PREFIXES = ["/login"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

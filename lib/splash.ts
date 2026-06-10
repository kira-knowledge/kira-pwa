// Pure: decide splash visibility from path + the sessionStorage flag value.
export function shouldShowSplash(path: string, shownFlag: string | null): boolean {
  if (shownFlag !== null) return false;
  return !path.startsWith("/share");
}

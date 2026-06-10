export type ThemeLike = { name: string; source_urls?: string[] };

// Pure: name of the first theme whose source_urls includes the url, else null.
export function primaryCategory(themes: ThemeLike[], sourceUrl: string): string | null {
  for (const t of themes) {
    if ((t.source_urls ?? []).includes(sourceUrl)) return t.name;
  }
  return null;
}

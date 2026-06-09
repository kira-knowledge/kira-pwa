export type WebResult = {
  n: number;
  title: string;
  url: string;
  site: string;
  snippet: string;
  published_date: string;
};

export type DeepenResult = {
  synthesis: string;
  results: WebResult[];
};

// Guard/normalize the /api/deepen response (defensive against missing fields).
export function parseDeepenResponse(raw: any): DeepenResult {
  const rawResults = Array.isArray(raw?.results) ? raw.results : [];
  const results: WebResult[] = rawResults.map((r: any, i: number) => ({
    n: typeof r?.n === "number" ? r.n : i + 1,
    title: String(r?.title ?? ""),
    url: String(r?.url ?? ""),
    site: String(r?.site ?? ""),
    snippet: String(r?.snippet ?? ""),
    published_date: String(r?.published_date ?? ""),
  }));
  return { synthesis: String(raw?.synthesis ?? ""), results };
}

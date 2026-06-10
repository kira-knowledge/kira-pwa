// Chat citations carry raw cdninstagram thumbnail URLs, which Chrome blocks
// cross-origin (CORP). Instead, derive the item id from the source URL (same
// shortcode rule as the orchestrator's reel_key) and use the /api/thumb proxy.
export function shortcodeFromUrl(url: string): string {
  const m = /\/(?:reel|p|tv)\/([^/?#]+)/.exec(url || "");
  return m ? m[1] : "";
}

// "" when no shortcode can be derived — callers fall back to the placeholder.
export function citationThumbSrc(sourceUrl: string): string {
  const code = shortcodeFromUrl(sourceUrl);
  return code ? `/api/thumb/${encodeURIComponent(code)}` : "";
}

// Pure: find the first Instagram URL inside arbitrary shared text, or null.
export function extractInstagramUrl(raw: string): string | null {
  const m = raw.match(/https?:\/\/[^\s"']*instagram\.com\/[^\s"']+/i);
  return m ? m[0] : null;
}

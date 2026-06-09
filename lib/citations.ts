import { Citation } from "./chatHistory";

export type Segment<T = Citation> = { text: string; citation?: T };

// Split answer text into segments, attaching the matching citation to each [n] marker.
export function splitCitations<T extends { n: number }>(
  answer: string,
  citations: T[]
): Segment<T>[] {
  const byN = new Map(citations.map((c) => [c.n, c]));
  const segments: Segment<T>[] = [];
  const re = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    if (m.index > last) segments.push({ text: answer.slice(last, m.index) });
    const citation = byN.get(Number(m[1]));
    segments.push(citation ? { text: m[0], citation } : { text: m[0] });
    last = re.lastIndex;
  }
  if (last < answer.length) segments.push({ text: answer.slice(last) });
  return segments;
}

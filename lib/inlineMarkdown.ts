export type InlineSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

// Pure: split a line of model output into styled spans. Citation markers like
// [1] are left inside the span text for splitCitations to handle.
export function parseInline(text: string): InlineSpan[] {
  // Fresh regex per call — a shared `g`-flag regex carries lastIndex state
  // across interleaved calls. `code` first so asterisks inside backticks stay
  // literal; bold before italic so `**` is never read as two italic markers.
  // Italic requires non-space edges so stray asterisks ("2 * 3") stay literal.
  const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\*(\S(?:[^*]*\S)?)\*/g;
  const spans: InlineSpan[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], code: true });
    else if (m[2] !== undefined) spans.push({ text: m[2], bold: true });
    else spans.push({ text: m[3], italic: true });
    last = INLINE.lastIndex;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans;
}

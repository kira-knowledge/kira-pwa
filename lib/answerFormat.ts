export type Block =
  | { type: "para"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const ORDERED = /^\d+[.)]\s+(.*)$/;
const BULLET = /^[-*•]\s+(.*)$/;
const HEADING = /^#{1,6}\s+(.*)$/;
// A line that is nothing but one bold span ("**Next steps:**") reads as a
// section label, not a sentence — promote it to a heading.
const BOLD_LINE = /^\*\*([^*]+)\*\*$/;

// Pure: parse answer text into heading + paragraph + list blocks for
// skimmable rendering. Citation markers like [1] are left inside the text for
// splitCitations to handle; inline markdown is handled by parseInline.
export function parseAnswerBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const raw of (text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const hm = line.match(HEADING) ?? line.match(BOLD_LINE);
    const om = line.match(ORDERED);
    const bm = line.match(BULLET);
    if (hm) {
      flush();
      blocks.push({ type: "heading", text: hm[1].trim() });
    } else if (om) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(om[1].trim());
    } else if (bm) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bm[1].trim());
    } else {
      flush();
      blocks.push({ type: "para", text: line });
    }
  }
  flush();
  return blocks;
}

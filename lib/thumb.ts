export type ThumbItem = { id: string; thumb_key?: string };

// "" when the item has no captured thumbnail — callers skip the <img> entirely.
export function thumbSrc(item: ThumbItem): string {
  return item.thumb_key ? `/api/thumb/${encodeURIComponent(item.id)}` : "";
}

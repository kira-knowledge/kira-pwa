export type HasSourceUrl = { source_url: string };

// Pure: keep items whose source_url is in the category's url set, in item order.
export function filterByCategory<T extends HasSourceUrl>(
  items: T[],
  sourceUrls: string[]
): T[] {
  const set = new Set(sourceUrls);
  return items.filter((it) => set.has(it.source_url));
}

export type Paged<T> = {
  pageItems: T[];
  pageCount: number;
  page: number;
};

export const PER_PAGE = 10;

// Pure: slice items for a 1-based page. Clamps page into [1, pageCount].
export function paginate<T>(items: T[], page: number, perPage: number = PER_PAGE): Paged<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const clamped = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = (clamped - 1) * perPage;
  return {
    pageItems: items.slice(start, start + perPage),
    pageCount,
    page: clamped,
  };
}

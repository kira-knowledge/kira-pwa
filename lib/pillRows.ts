// Greedy flex-wrap packing: given measured pill widths, find how many theme
// pills can be shown so that everything — including the trailing "More..."
// pill — fits within `maxRows` wrapped rows.

function rowsUsed(widths: number[], containerWidth: number, gap: number): number {
  let rows = 0;
  let x = 0;
  for (const w of widths) {
    if (x === 0) {
      // First pill on a row always sits there, even if wider than the container.
      rows += 1;
      x = w;
    } else if (x + gap + w <= containerWidth) {
      x += gap + w;
    } else {
      rows += 1;
      x = w;
    }
  }
  return rows;
}

export function maxPillsForRows(
  pillWidths: number[],
  moreWidth: number,
  containerWidth: number,
  gap: number,
  maxRows: number
): number {
  if (containerWidth <= 0) return pillWidths.length;
  for (let n = pillWidths.length; n >= 0; n--) {
    const widths = [...pillWidths.slice(0, n), moreWidth];
    if (rowsUsed(widths, containerWidth, gap) <= maxRows) return n;
  }
  return 0;
}

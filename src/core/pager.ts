/** Posts per page on the home list and tag pages. */
export const LIST_PAGE_SIZE = 20;

/**
 * Which page numbers to draw for `total` pages with `current` (0-based)
 * selected: all of them when there are at most `max`, otherwise the first,
 * the last, a window around the current page and `null` for each gap.
 * e.g. 15 pages at page 7 -> [0, null, 6, 7, 8, null, 14]
 */
export function pageNumbers(
  current: number,
  total: number,
  max = 7
): (number | null)[] {
  if (total <= max) return Array.from({ length: total }, (_, i) => i);
  const side = Math.floor((max - 4) / 2); // pages shown on each side of current
  let start = Math.max(1, current - side);
  let end = Math.min(total - 2, current + side);
  // keep the window the same width near the ends
  if (current - side < 1) end = Math.min(total - 2, 1 + 2 * side);
  if (current + side > total - 2) start = Math.max(1, total - 2 - 2 * side);
  const out: (number | null)[] = [0];
  if (start > 1) out.push(null);
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 2) out.push(null);
  out.push(total - 1);
  return out;
}

/**
 * Bounded, honest pagination.
 *
 * Lists in this app grew past what a screen can show without lying: 40+ news
 * items, dozens of chunks, saved class plans. A paginator exposes a page and the
 * real total, so "cargar más" means something and the count is never invented.
 */
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PageRequest {
  limit: number;
  offset: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

/** Reads `limit`/`offset` from a query string with hard clamps. */
export function parsePage(params: URLSearchParams): PageRequest {
  const rawLimit = Number(params.get("limit") ?? DEFAULT_LIMIT);
  const rawOffset = Number(params.get("offset") ?? 0);

  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

  return { limit, offset };
}

/** Slices one page and reports whether another one exists. */
export function paginate<T>(items: readonly T[], page: PageRequest): Page<T> {
  const items_ = items.slice(page.offset, page.offset + page.limit);
  return {
    items: items_,
    total: items.length,
    hasMore: page.offset + items_.length < items.length,
  };
}

/** Whether the caller actually asked for a page (so arrays keep working). */
export function wantsPage(params: URLSearchParams): boolean {
  return params.has("limit") || params.has("offset");
}

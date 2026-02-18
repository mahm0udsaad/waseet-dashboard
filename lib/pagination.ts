const DEFAULT_PAGE_SIZE = 20;

export function parsePageParam(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

export function getPaginationRange(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function getTotalPages(totalItems: number, pageSize = DEFAULT_PAGE_SIZE) {
  if (totalItems <= 0) {
    return 1;
  }
  return Math.ceil(totalItems / pageSize);
}

export function getPaginationSummary(
  totalItems: number,
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
) {
  if (totalItems === 0) {
    return { from: 0, to: 0 };
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return { from, to };
}

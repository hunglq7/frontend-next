export type PaginationParams = {
  page: number;
  limit: number;
  search: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function loadAllPages<T>(
  loadPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const firstPage = await loadPage(1, 100);
  const items = [...firstPage.data];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await loadPage(page, 100);
    items.push(...result.data);
  }

  return items;
}

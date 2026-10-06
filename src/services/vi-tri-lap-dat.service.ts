import { apiClient } from "@/lib/api-client";

export type ViTriLapDat = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedViTriLapDat = {
  data: ViTriLapDat[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ViTriLapDatListParams = {
  page: number;
  limit: number;
  search: string;
};

export type SaveViTriLapDatParams = {
  unitId: number | null;
  name: string;
};

export type DeleteViTriLapDatParams = {
  ids: number[];
  bulk: boolean;
};

export async function getViTriLapDatList({
  page,
  limit,
  search,
}: ViTriLapDatListParams): Promise<PaginatedViTriLapDat> {
  const response = await apiClient.get<PaginatedViTriLapDat>("/vitrilapdats", {
    params: { page, limit, search: search || undefined },
  });
  return response.data;
}

export async function getAllMatchingViTriLapDat(
  search: string,
): Promise<ViTriLapDat[]> {
  const firstPage = await getViTriLapDatList({ page: 1, limit: 100, search });
  const vitrilapdats = [...firstPage.data];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await getViTriLapDatList({ page, limit: 100, search });
    vitrilapdats.push(...result.data);
  }

  return vitrilapdats;
}

export function saveViTriLapDat({ unitId, name }: SaveViTriLapDatParams) {
  return unitId === null
    ? apiClient.post("/vitrilapdats", { name })
    : apiClient.patch(`/vitrilapdats/${unitId}`, { name });
}

export function deleteViTriLapDat({ ids, bulk }: DeleteViTriLapDatParams) {
  return bulk
    ? apiClient.delete("/vitrilapdats", { data: { ids } })
    : apiClient.delete(`/vitrilapdats/${ids[0]}`);
}

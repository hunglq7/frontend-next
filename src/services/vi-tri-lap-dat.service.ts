import { apiClient } from "@/lib/api-client";

export type ViTriLapDat = {
  id: number;
  ten_vi_tri: string;
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
  vitrilapdatId: number | null;
  ten_vi_tri: string;
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

export function saveViTriLapDat({
  vitrilapdatId,
  ten_vi_tri,
}: SaveViTriLapDatParams) {
  return vitrilapdatId === null
    ? apiClient.post("/vitrilapdats", { ten_vi_tri })
    : apiClient.patch(`/vitrilapdats/${vitrilapdatId}`, { ten_vi_tri });
}

export function deleteViTriLapDat({ ids, bulk }: DeleteViTriLapDatParams) {
  return bulk
    ? apiClient.delete("/vitrilapdats", { data: { ids } })
    : apiClient.delete(`/vitrilapdats/${ids[0]}`);
}

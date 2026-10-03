import { apiClient } from "@/lib/api-client";

export type DonVi = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedDonVi = {
  data: DonVi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type DonViListParams = {
  page: number;
  limit: number;
  search: string;
};

export type SaveDonViParams = {
  unitId: number | null;
  name: string;
};

export type DeleteDonViParams = {
  ids: number[];
  bulk: boolean;
};

export async function getDonViList({
  page,
  limit,
  search,
}: DonViListParams): Promise<PaginatedDonVi> {
  const response = await apiClient.get<PaginatedDonVi>("/donvis", {
    params: { page, limit, search: search || undefined },
  });
  return response.data;
}

export async function getAllMatchingDonVi(search: string): Promise<DonVi[]> {
  const firstPage = await getDonViList({ page: 1, limit: 100, search });
  const units = [...firstPage.data];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await getDonViList({ page, limit: 100, search });
    units.push(...result.data);
  }

  return units;
}

export function saveDonVi({ unitId, name }: SaveDonViParams) {
  return unitId === null
    ? apiClient.post("/donvis", { name })
    : apiClient.patch(`/donvis/${unitId}`, { name });
}

export function deleteDonVi({ ids, bulk }: DeleteDonViParams) {
  return bulk
    ? apiClient.delete("/donvis", { data: { ids } })
    : apiClient.delete(`/donvis/${ids[0]}`);
}

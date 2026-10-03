import { apiClient } from "@/lib/api-client";
import { loadAllPages, type PaginatedResponse, type PaginationParams } from "./pagination";

export type LoaiThietBi = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveLoaiThietBiParams = { id: number | null; name: string };
export type DeleteLoaiThietBiParams = { ids: number[]; bulk: boolean };

export async function getLoaiThietBiList(params: PaginationParams) {
  const response = await apiClient.get<PaginatedResponse<LoaiThietBi>>(
    "/loaithietbis",
    { params },
  );
  return response.data;
}

export function getAllLoaiThietBis(search: string) {
  return loadAllPages((page, limit) =>
    getLoaiThietBiList({ page, limit, search }),
  );
}

export function saveLoaiThietBi({ id, name }: SaveLoaiThietBiParams) {
  return id === null
    ? apiClient.post("/loaithietbis", { name })
    : apiClient.patch(`/loaithietbis/${id}`, { name });
}

export function deleteLoaiThietBi({
  ids,
  bulk,
}: DeleteLoaiThietBiParams) {
  return bulk
    ? apiClient.delete("/loaithietbis", { data: { ids } })
    : apiClient.delete(`/loaithietbis/${ids[0]}`);
}

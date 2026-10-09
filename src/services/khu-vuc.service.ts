import { apiClient } from "@/lib/api-client";
import {
  loadAllPages,
  type PaginatedResponse,
  type PaginationParams,
} from "./pagination";

export type KhuVuc = {
  id: number;
  Tên_khu_vuc: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveKhuVucParams = { id: number | null; Tên_khu_vuc: string };
export type DeleteKhuVucParams = { ids: number[]; bulk: boolean };

export async function getKhuVucList(params: PaginationParams) {
  const response = await apiClient.get<PaginatedResponse<KhuVuc>>("/khuvucs", {
    params,
  });
  return response.data;
}

export function getAllKhuVucs(search: string) {
  return loadAllPages((page, limit) => getKhuVucList({ page, limit, search }));
}

export function saveKhuVuc({ id, Tên_khu_vuc }: SaveKhuVucParams) {
  return id === null
    ? apiClient.post("/khuvucs", { Tên_khu_vuc })
    : apiClient.patch(`/khuvucs/${id}`, { Tên_khu_vuc });
}

export function deleteKhuVuc({ ids, bulk }: DeleteKhuVucParams) {
  return bulk
    ? apiClient.delete("/khuvucs", { data: { ids } })
    : apiClient.delete(`/khuvucs/${ids[0]}`);
}

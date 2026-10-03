import { apiClient } from "@/lib/api-client";
import { loadAllPages, type PaginatedResponse, type PaginationParams } from "./pagination";

export type Role = { id: number; name: string };
export type SaveRoleParams = { id: number | null; name: string };

export async function getRoleList(params: PaginationParams) {
  const response = await apiClient.get<PaginatedResponse<Role>>("/roles", {
    params,
  });
  return response.data;
}

export function getAllRoles() {
  return loadAllPages((page, limit) =>
    getRoleList({ page, limit, search: "" }),
  );
}

export function saveRole({ id, name }: SaveRoleParams) {
  return id === null
    ? apiClient.post("/roles", { name })
    : apiClient.patch(`/roles/${id}`, { name });
}

export function deleteRole(id: number) {
  return apiClient.delete(`/roles/${id}`);
}

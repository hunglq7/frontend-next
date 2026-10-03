import { apiClient } from "@/lib/api-client";
import type { Account } from "./users.service";
import { getAllUsers } from "./users.service";
import type { Role } from "./roles.service";
import { getAllRoles } from "./roles.service";
import { loadAllPages, type PaginatedResponse, type PaginationParams } from "./pagination";

export type UserRole = {
  id: number;
  idUser: number;
  idRole: number;
  user: Pick<Account, "id" | "name" | "email">;
  role: Role;
};

export type AssignUserRoleParams = { idUser: number; idRole: number };

export async function getUserRoleList(params: PaginationParams) {
  const response = await apiClient.get<PaginatedResponse<UserRole>>(
    "/user-roles",
    { params },
  );
  return response.data;
}

export function getAllUserRoleAssignments() {
  return loadAllPages((page, limit) =>
    getUserRoleList({ page, limit, search: "" }),
  );
}

export function getUserRoleOptions(): Promise<[Account[], Role[]]> {
  return Promise.all([getAllUsers(), getAllRoles()]);
}

export function assignUserRole(params: AssignUserRoleParams) {
  return apiClient.post("/user-roles", params);
}

export function deleteUserRole(id: number) {
  return apiClient.delete(`/user-roles/${id}`);
}

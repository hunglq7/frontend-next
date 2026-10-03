import { apiClient } from "@/lib/api-client";
import { loadAllPages, type PaginatedResponse, type PaginationParams } from "./pagination";

export type Account = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string | null;
  createdAt: string;
};

export type SaveAccountParams = {
  id: number | null;
  formData: FormData;
};

export async function getUserList(params: PaginationParams) {
  const response = await apiClient.get<PaginatedResponse<Account>>("/users", {
    params,
  });
  return response.data;
}

export function getAllUsers() {
  return loadAllPages((page, limit) =>
    getUserList({ page, limit, search: "" }),
  );
}

export function saveAccount({ id, formData }: SaveAccountParams) {
  return id === null
    ? apiClient.post("/users", formData)
    : apiClient.patch(`/users/${id}`, formData);
}

export function deleteAccount(id: number) {
  return apiClient.delete(`/users/${id}`);
}

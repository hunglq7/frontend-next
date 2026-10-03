import {
  assignUserRole,
  deleteUserRole,
  getUserRoleList,
  getUserRoleOptions,
  type AssignUserRoleParams,
} from "@/services/user-roles.service";
import type { PaginationParams } from "@/services/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["user-roles"] as const;

export function useUserRoleList(params: PaginationParams) {
  return useQuery({
    queryKey: [...queryKey, params.page, params.limit, params.search],
    queryFn: () => getUserRoleList(params),
  });
}

export function useUserRoleOptions() {
  return useQuery({
    queryKey: [...queryKey, "options"],
    queryFn: getUserRoleOptions,
    staleTime: 60_000,
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AssignUserRoleParams) => assignUserRole(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUserRole(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

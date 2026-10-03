import {
  deleteRole,
  getRoleList,
  saveRole,
  type SaveRoleParams,
} from "@/services/roles.service";
import type { PaginationParams } from "@/services/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["roles"] as const;

export function useRoleList(params: PaginationParams) {
  return useQuery({
    queryKey: [...queryKey, params.page, params.limit, params.search],
    queryFn: () => getRoleList(params),
  });
}

export function useSaveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: SaveRoleParams) => saveRole(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: ["user-roles", "options"],
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: ["user-roles", "options"],
      });
    },
  });
}

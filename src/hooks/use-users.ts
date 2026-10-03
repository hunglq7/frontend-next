import {
  deleteAccount,
  getUserList,
  saveAccount,
  type SaveAccountParams,
} from "@/services/users.service";
import type { PaginationParams } from "@/services/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["users"] as const;

export function useUserList(params: PaginationParams) {
  return useQuery({
    queryKey: [...queryKey, params.page, params.limit, params.search],
    queryFn: () => getUserList(params),
  });
}

export function useSaveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: SaveAccountParams) => saveAccount(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: ["user-roles", "options"],
      });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: ["user-roles", "options"],
      });
    },
  });
}

import {
  deleteKhuVuc,
  getKhuVucList,
  saveKhuVuc,
  type DeleteKhuVucParams,
  type SaveKhuVucParams,
} from "@/services/khu-vuc.service";
import type { PaginationParams } from "@/services/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["khuvucs"] as const;

export function useKhuVucList(params: PaginationParams) {
  return useQuery({
    queryKey: [...queryKey, params.page, params.limit, params.search],
    queryFn: () => getKhuVucList(params),
  });
}

export function useSaveKhuVuc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: SaveKhuVucParams) => saveKhuVuc(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteKhuVuc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteKhuVucParams) => deleteKhuVuc(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

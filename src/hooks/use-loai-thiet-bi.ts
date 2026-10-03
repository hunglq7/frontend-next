import {
  deleteLoaiThietBi,
  getLoaiThietBiList,
  saveLoaiThietBi,
  type DeleteLoaiThietBiParams,
  type SaveLoaiThietBiParams,
} from "@/services/loai-thiet-bi.service";
import type { PaginationParams } from "@/services/pagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const queryKey = ["loaithietbis"] as const;

export function useLoaiThietBiList(params: PaginationParams) {
  return useQuery({
    queryKey: [...queryKey, params.page, params.limit, params.search],
    queryFn: () => getLoaiThietBiList(params),
  });
}

export function useSaveLoaiThietBi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: SaveLoaiThietBiParams) => saveLoaiThietBi(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteLoaiThietBi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteLoaiThietBiParams) =>
      deleteLoaiThietBi(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

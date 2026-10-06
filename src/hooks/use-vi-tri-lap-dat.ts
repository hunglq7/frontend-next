import {
  deleteViTriLapDat,
  getViTriLapDatList,
  saveViTriLapDat,
  type DeleteViTriLapDatParams,
  type ViTriLapDatListParams,
  type SaveViTriLapDatParams,
} from "@/services/vi-tri-lap-dat.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const viTriLapDatQueryKeys = {
  all: ["vitrilapdats"] as const,
  list: (params: ViTriLapDatListParams) =>
    [
      ...viTriLapDatQueryKeys.all,
      params.page,
      params.limit,
      params.search,
    ] as const,
};

export function useViTriLapDatList(params: ViTriLapDatListParams) {
  return useQuery({
    queryKey: viTriLapDatQueryKeys.list(params),
    queryFn: () => getViTriLapDatList(params),
  });
}

export function useSaveViTriLapDat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveViTriLapDatParams) => saveViTriLapDat(params),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: viTriLapDatQueryKeys.all }),
  });
}

export function useDeleteViTriLapDat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteViTriLapDatParams) => deleteViTriLapDat(params),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: viTriLapDatQueryKeys.all }),
  });
}

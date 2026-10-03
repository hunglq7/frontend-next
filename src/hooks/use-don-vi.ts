import {
  deleteDonVi,
  getDonViList,
  saveDonVi,
  type DeleteDonViParams,
  type DonViListParams,
  type SaveDonViParams,
} from "@/services/don-vi.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const donViQueryKeys = {
  all: ["donvis"] as const,
  list: (params: DonViListParams) =>
    [...donViQueryKeys.all, params.page, params.limit, params.search] as const,
};

export function useDonViList(params: DonViListParams) {
  return useQuery({
    queryKey: donViQueryKeys.list(params),
    queryFn: () => getDonViList(params),
  });
}

export function useSaveDonVi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveDonViParams) => saveDonVi(params),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: donViQueryKeys.all }),
  });
}

export function useDeleteDonVi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteDonViParams) => deleteDonVi(params),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: donViQueryKeys.all }),
  });
}

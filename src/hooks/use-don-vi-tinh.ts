import {
  deleteDonViTinh,
  getDonViTinhList,
  saveDonViTinh,
  type DeleteDonViTinhParams,
  type DonViTinhListParams,
  type SaveDonViTinhParams,
} from "@/services/don-vi-tinh.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const donVitinhQueryKeys = {
  all: ["donvitinhs"] as const,
  list: (params: DonViTinhListParams) =>
    [
      ...donVitinhQueryKeys.all,
      params.page,
      params.limit,
      params.search,
    ] as const,
};

export function useDonViTinhList(params: DonViTinhListParams) {
  return useQuery({
    queryKey: donVitinhQueryKeys.list(params),
    queryFn: () => getDonViTinhList(params),
  });
}

export function useSaveDonViTinh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveDonViTinhParams) => saveDonViTinh(params),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: donVitinhQueryKeys.all }),
  });
}

export function useDeleteDonViTinh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteDonViTinhParams) => deleteDonViTinh(params),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: donVitinhQueryKeys.all }),
  });
}

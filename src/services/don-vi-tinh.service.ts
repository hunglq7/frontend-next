import { apiClient } from "@/lib/api-client";

export type DonViTinh = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedDonViTinh = {
  data: DonViTinh[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type DonViTinhListParams = {
  page: number;
  limit: number;
  search: string;
};

export type SaveDonViTinhParams = {
  donvitinhId: number | null;
  name: string;
};

export type DeleteDonViTinhParams = {
  ids: number[];
  bulk: boolean;
};

export async function getDonViTinhList({
  page,
  limit,
  search,
}: DonViTinhListParams): Promise<PaginatedDonViTinh> {
  const response = await apiClient.get<PaginatedDonViTinh>("/donvitinhs", {
    params: { page, limit, search: search || undefined },
  });
  return response.data;
}

export async function getAllMatchingDonViTinh(
  search: string,
): Promise<DonViTinh[]> {
  const firstPage = await getDonViTinhList({ page: 1, limit: 100, search });
  const donvitinhs = [...firstPage.data];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await getDonViTinhList({ page, limit: 100, search });
    donvitinhs.push(...result.data);
  }

  return donvitinhs;
}

export function saveDonViTinh({ donvitinhId, name }: SaveDonViTinhParams) {
  return donvitinhId === null
    ? apiClient.post("/donvitinhs", { name })
    : apiClient.patch(`/donvitinhs/${donvitinhId}`, { name });
}

export function deleteDonViTinh({ ids, bulk }: DeleteDonViTinhParams) {
  return bulk
    ? apiClient.delete("/donvitinhs", { data: { ids } })
    : apiClient.delete(`/donvitinhs/${ids[0]}`);
}

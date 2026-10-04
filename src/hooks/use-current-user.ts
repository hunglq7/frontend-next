import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type CurrentUser = {
  name: string;
  email: string | null;
  avatar: string | null;
  address?: string | null;
  phone?: string | null;
  userRoles?: { role?: { name?: string } }[];
};

export const currentUserQueryKey = ["current-user"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const response = await apiClient.get<CurrentUser>("/users/me");
      return response.data;
    },
  });
}

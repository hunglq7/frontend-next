"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { currentUserQueryKey } from "@/hooks/use-current-user";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: false,
          },
        },
      }),
  );

  useEffect(() => {
    const refreshCurrentUser = () => {
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    };

    window.addEventListener("account-profile-updated", refreshCurrentUser);
    return () =>
      window.removeEventListener("account-profile-updated", refreshCurrentUser);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}
    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}

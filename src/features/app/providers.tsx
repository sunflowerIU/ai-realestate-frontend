"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }));
  return <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="mero-aangan-theme"><QueryClientProvider client={client}>{children}</QueryClientProvider></ThemeProvider>;
}

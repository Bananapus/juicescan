"use client";

import { wagmiConfig } from "@/lib/wagmiConfig";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ConnectKitProvider } from "connectkit";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { WagmiConfig } from "wagmi";

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <ConnectKitProvider>
        <QueryClientProvider client={queryClient}>
          <ApolloProvider client={client}>{mounted && children}</ApolloProvider>
        </QueryClientProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

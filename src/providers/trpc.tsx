// Provedor de contexto para inicialização do cliente tRPC e integração com React Query.
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";

// Instância principal do cliente tRPC tipada com o router do backend
export const trpc = createTRPCReact<AppRouter>();

// Cliente do React Query para gerenciamento e cache do estado das consultas
const queryClient = new QueryClient();

// Configuração do cliente tRPC com suporte a chamadas HTTP agrupadas (batching) e envio de credenciais (cookies)
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include", // Permite envio de cookies de sessão
        });
      },
    }),
  ],
});

// Componente provider que envelopa o app permitindo consumo das queries do tRPC em toda a árvore React
export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}


// Hook customizado para obter e gerenciar o estado de autenticação do usuário logado.
import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

// Hook que provê dados do usuário autenticado, papéis de acesso e funcionalidade de logout
export function useAuth() {
  const utils = trpc.useUtils();

  // Consulta as informações do usuário atual na API
  const {
    data: user,
    isLoading,
    error,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    retry: false,             // Não tenta novamente em caso de falha de autenticação
  });

  // Mutação para encerrar a sessão do usuário
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      // Invalida todos os dados em cache e recarrega a página do app
      await utils.invalidate();
      window.location.reload();
    },
  });

  // Função disparada para executar o logout
  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === "admin",
      isOngManager: user?.role === "ong_manager",
      isVolunteer: user?.role === "user",
      error,
      logout,
    }),
    [user, isLoading, error, logoutMutation.isPending, logout]
  );
}


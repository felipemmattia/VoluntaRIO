import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

// Inicializa a instância tRPC com suporte a superjson e define o tipo do contexto
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Helpers para criação de rotas (routers) e consultas públicas (sem autenticação)
export const createRouter = t.router;
export const publicQuery = t.procedure;

// Middleware para verificar se o usuário está autenticado
const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Função geradora de middlewares para validação de nível de acesso (roles)
function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

// Procedimentos reutilizáveis com diferentes níveis de segurança/autorização
export const authedQuery = t.procedure.use(requireAuth); // Requer qualquer usuário logado
export const adminQuery = authedQuery.use(requireRole("admin")); // Requer perfil de administrador
export const ongManagerQuery = authedQuery.use(requireRole("ong_manager")); // Requer perfil de gestor de ONG

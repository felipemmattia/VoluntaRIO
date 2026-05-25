import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./lib/session";
import { findUserById } from "./queries/users";

// Define a estrutura do contexto das rotas do tRPC
export type TrpcContext = {
  req: Request;              // A requisição HTTP
  resHeaders: Headers;       // Os cabeçalhos de resposta HTTP
  user?: User;               // O usuário autenticado da sessão (se houver)
};

// Cria o contexto de cada requisição do tRPC, resolvendo a sessão do usuário
export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    // Analisa os cookies enviados nos cabeçalhos da requisição
    const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
    const token = cookies[Session.cookieName];
    
    // Se o token de sessão existir, valida-o e busca o respectivo usuário no banco
    if (token) {
      const payload = await verifySessionToken(token);
      if (payload) {
        const user = await findUserById(payload.userId);
        if (user) {
          ctx.user = user as User;
        }
      }
    }
  } catch {
    // A autenticação é opcional neste ponto; falhas silenciosas não interrompem a requisição
  }
  return ctx;
}

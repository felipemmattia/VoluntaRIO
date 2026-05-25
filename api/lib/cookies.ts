import type { CookieOptions } from "hono/utils/cookie";

// Verifica se a requisição está vindo do ambiente local (localhost)
function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

// Configura as opções do cookie de sessão baseando-se em ambiente de desenvolvimento ou produção (HTTPS, SameSite)
export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true, // Garante que o cookie não seja acessível via JavaScript cliente (mitiga XSS)
    path: "/",
    sameSite: localhost ? "Lax" : "None", // Ajusta SameSite de acordo com ambiente (None para HTTPS cross-site)
    secure: !localhost, // Requer HTTPS em produção
  };
}

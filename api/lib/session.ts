import * as jose from "jose";
import { env } from "../lib/env";

const JWT_ALG = "HS256"; // Algoritmo padrão para assinatura dos tokens JWT

export type SessionPayload = {
  userId: number; // Estrutura de dados contida no token (ID do usuário)
};

// Gera e assina um token JWT contendo as informações da sessão do usuário
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year") // Validade do token de 1 ano
    .sign(secret);
}

// Verifica e decodifica o token JWT de sessão fornecido nos cookies
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[sessão] Nenhum token de sessão fornecido para verificação.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const userId = payload.userId as number;
    if (!userId) {
      console.warn("[sessão] Payload do JWT não contém userId.");
      return null;
    }
    return { userId } as SessionPayload;
  } catch (error) {
    console.warn("[sessão] Falha ao verificar JWT:", error);
    return null;
  }
}

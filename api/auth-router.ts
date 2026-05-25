import * as cookie from "cookie";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery } from "./middleware";
import { findUserByEmail, createUser, findUserById } from "./queries/users";
import { signSessionToken } from "./lib/session";
import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";
import { sendWelcomeEmail } from "./lib/email";

const SALT_ROUNDS = 10;

export const authRouter = createRouter({
  // Retorna o perfil do usuário logado baseado no cookie de sessão fornecido
  me: publicQuery.query(async ({ ctx }) => {
    const cookies = cookie.parse(ctx.req.headers.get("cookie") || "");
    const token = cookies[Session.cookieName];
    if (!token) return null;

    try {
      const payload = await verifySessionToken(token);
      if (!payload) return null;
      return findUserById(payload.userId);
    } catch {
      return null;
    }
  }),

  // Realiza o cadastro de uma nova conta de voluntário ou gestor de ONG na plataforma
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
        role: z.enum(["user", "ong_manager"]).default("user"),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este email já está cadastrado",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      const isFirstUser = await isFirstUserInSystem();
      const role = isFirstUser ? "admin" : input.role;

      const user = await createUser({
        name: input.name,
        email: input.email,
        passwordHash,
        role,
      });

      if (!user || !user.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar usuario",
        });
      }

      const token = await signSessionToken({ userId: user.id });

      sendWelcomeEmail({ email: input.email, name: input.name, role }).catch(() => {});

      return { success: true, userId: user.id, token, role };
    }),

  // Autentica o usuário por e-mail e senha, injetando o cookie set-cookie
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await findUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      const token = await signSessionToken({ userId: user.id! });

      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "strict" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  // Autentica o usuário via login social Google OAuth, criando a conta se for o primeiro acesso
  google: publicQuery
    .input(
      z.object({
        credential: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!env.googleClientId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google OAuth não está configurado",
        });
      }

      const payload = await verifyGoogleToken(input.credential, env.googleClientId);
      if (!payload || !payload.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Não foi possível verificar o token do Google",
        });
      }

      const email = payload.email;
      const name = payload.name || email.split("@")[0];

      let user = await findUserByEmail(email);

      if (!user) {
        const isFirstUser = await isFirstUserInSystem();
        const role = isFirstUser ? "admin" : "user";

        const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-12), SALT_ROUNDS);

        const newUser = await createUser({
          name,
          email,
          passwordHash,
          role,
        });

        if (!newUser || !newUser.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar usuário via Google",
          });
        }

        user = newUser;
        sendWelcomeEmail({ email, name, role }).catch(() => {});
      }

      const token = await signSessionToken({ userId: user.id! });

      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "strict" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  // Realiza o logout do usuário limpando o cookie de sessão do navegador
  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "strict" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});

async function verifySessionToken(token: string) {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const userId = payload.userId as number;
    if (!userId) return null;
    return { userId };
  } catch {
    return null;
  }
}

async function isFirstUserInSystem(): Promise<boolean> {
  const { getDb } = await import("./queries/connection");
  const { users } = await import("@db/schema");
  const result = await getDb().select({ count: users.id }).from(users);
  return result.length === 0;
}

async function verifyGoogleToken(token: string, clientId: string) {
  try {
    const jose = await import("jose");

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const headerJson = Buffer.from(parts[0], "base64url").toString();
    const header = JSON.parse(headerJson);
    const kid = header.kid;
    if (!kid) return null;

    const certsRes = await fetch("https://www.googleapis.com/oauth2/v3/certs");
    const certs = await certsRes.json();

    const jwk = certs.keys.find((k: { kid: string }) => k.kid === kid);
    if (!jwk) return null;

    const publicKey = await jose.importJWK(jwk, "RS256");

    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      audience: clientId,
      issuer: ["accounts.google.com", "https://accounts.google.com"],
    });

    return {
      email: payload.email as string,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
    };
  } catch (err) {
    console.error("Google token verification failed:", err);
    return null;
  }
}

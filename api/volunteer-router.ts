import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { volunteerProfiles } from "@db/schema";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const volunteerRouter = createRouter({
  // Retorna o perfil de voluntário associado ao usuário logado no momento
  getMyProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(volunteerProfiles)
      .where(eq(volunteerProfiles.userId, ctx.user.id));
    return result[0] ?? null;
  }),

  // Retorna o perfil de voluntário pelo ID do usuário
  getByUserId: authedQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(volunteerProfiles)
        .where(eq(volunteerProfiles.userId, input.userId));
      return result[0] ?? null;
    }),

  // Permite criar ou atualizar o perfil com interesses, habilidades e geolocalização do voluntário logado
  createOrUpdate: authedQuery
    .input(
      z.object({
        bio: z.string().optional(),
        phone: z.string().max(20).optional(),
        city: z.string().max(100).optional(),
        state: z.enum(BRAZIL_STATES).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        certifications: z.string().optional(),
        experience: z.string().optional(),
        interests: z.string().optional(),
        shareLocation: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(volunteerProfiles)
        .where(eq(volunteerProfiles.userId, ctx.user.id));

      if (existing[0]) {
        await db
          .update(volunteerProfiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(volunteerProfiles.userId, ctx.user.id));
        return { ...existing[0], ...input };
      } else {
        const result = await db.insert(volunteerProfiles).values({
          userId: ctx.user.id,
          ...input,
        });
        return { id: Number((result as unknown as { insertId: number }).insertId), userId: ctx.user.id, ...input };
      }
    }),

  // Lista todos os perfis de voluntários cadastrados (acesso restrito a administradores)
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(volunteerProfiles);
  }),
});

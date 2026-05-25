import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { ongProfiles, events, users } from "@db/schema";
import { sendOngApprovalEmail, sendOngRejectionEmail } from "./lib/email";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const ongRouter = createRouter({
  // Retorna todas as ONGs cadastradas no sistema
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(ongProfiles).orderBy(desc(ongProfiles.createdAt));
  }),

  // Retorna apenas as ONGs que possuem status ativo na plataforma
  listActive: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(ongProfiles)
      .where(eq(ongProfiles.status, "active"))
      .orderBy(desc(ongProfiles.createdAt));
  }),

  // Busca uma ONG pelo seu ID único de perfil
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(ongProfiles)
        .where(eq(ongProfiles.id, input.id));
      return result[0] ?? null;
    }),

  // Busca uma ONG associada ao ID do usuário gestor da mesma
  getByUserId: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(ongProfiles)
        .where(eq(ongProfiles.userId, input.userId));
      return result[0] ?? null;
    }),

  // Cria o perfil inicial da ONG para o usuário autenticado, mudando o papel dele para gestor de ONG
  create: authedQuery
    .input(
      z.object({
        cnpj: z.string().max(18).nullish(),
        displayName: z.string().min(1).max(255),
        mission: z.string().nullish(),
        description: z.string().nullish(),
        website: z.string().max(255).nullish(),
        phone: z.string().max(20).nullish(),
        email: z.string().email().max(320).nullish(),
        city: z.string().max(100).nullish(),
        state: z.enum(BRAZIL_STATES).nullish(),
        latitude: z.string().nullish(),
        longitude: z.string().nullish(),
        address: z.string().nullish(),
        autoAccept: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .update(users)
        .set({ role: "ong_manager" })
        .where(eq(users.id, userId));

      const result = await db.insert(ongProfiles).values({
        userId,
        ...input,
        status: "active",
      });

      return { id: Number((result as unknown as { insertId: number }).insertId), ...input };
    }),

  // Permite que o gestor ou administrador atualize os dados da sua ONG
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        cnpj: z.string().max(18).nullish(),
        displayName: z.string().min(1).max(255).optional(),
        mission: z.string().nullish(),
        description: z.string().nullish(),
        website: z.string().max(255).nullish(),
        phone: z.string().max(20).nullish(),
        email: z.string().email().max(320).nullish(),
        city: z.string().max(100).nullish(),
        state: z.enum(BRAZIL_STATES).nullish(),
        latitude: z.string().nullish(),
        longitude: z.string().nullish(),
        address: z.string().nullish(),
        autoAccept: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const existing = await db
        .select()
        .from(ongProfiles)
        .where(eq(ongProfiles.id, id));
      if (!existing[0]) throw new Error("ONG nao encontrada");
      if (existing[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      await db.update(ongProfiles).set(data).where(eq(ongProfiles.id, id));
      return { id, ...data };
    }),

  // Permite que o administrador altere o status de uma ONG (ex: aprovar, suspender) e dispare avisos por e-mail
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "suspended", "pending"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, input.id));
      if (!ong[0]) throw new Error("ONG nao encontrada");

      await db
        .update(ongProfiles)
        .set({ status: input.status })
        .where(eq(ongProfiles.id, input.id));

      const ongUser = await db.select().from(users).where(eq(users.id, ong[0].userId));
      if (ongUser[0]) {
        if (input.status === "active") {
          sendOngApprovalEmail({
            email: ongUser[0].email ?? "",
            name: ongUser[0].name ?? "Gerente",
            ongName: ong[0].displayName,
          }).catch(() => {});
        } else if (input.status === "suspended") {
          sendOngRejectionEmail({
            email: ongUser[0].email ?? "",
            name: ongUser[0].name ?? "Gerente",
            ongName: ong[0].displayName,
          }).catch(() => {});
        }
      }

      return { success: true };
    }),

  // Retorna estatísticas de eventos criados pela ONG (total, ativos e concluídos)
  getStats: publicQuery
    .input(z.object({ ongId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const ongEvents = await db
        .select()
        .from(events)
        .where(eq(events.ongId, input.ongId));
      return {
        totalEvents: ongEvents.length,
        activeEvents: ongEvents.filter((e) => e.status === "active").length,
        completedEvents: ongEvents.filter((e) => e.status === "completed").length,
      };
    }),

  // Retorna o perfil de ONG associado ao usuário atualmente logado
  getMyProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(ongProfiles)
      .where(eq(ongProfiles.userId, ctx.user.id));
    return result[0] ?? null;
  }),

  // Cria ou atualiza o perfil de ONG, dependendo se o registro já existe no banco de dados
  createOrUpdate: authedQuery
    .input(
      z.object({
        id: z.number().optional(),
        cnpj: z.string().max(18).nullish(),
        displayName: z.string().min(1).max(255).optional(),
        mission: z.string().nullish(),
        description: z.string().nullish(),
        website: z.string().max(255).nullish(),
        phone: z.string().max(20).nullish(),
        email: z.string().email().max(320).nullish(),
        city: z.string().max(100).nullish(),
        state: z.enum(BRAZIL_STATES).nullish(),
        latitude: z.string().nullish(),
        longitude: z.string().nullish(),
        address: z.string().nullish(),
        autoAccept: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      if (id) {
        const existing = await db
          .select()
          .from(ongProfiles)
          .where(eq(ongProfiles.id, id));
        if (!existing[0]) throw new Error("ONG nao encontrada");
        if (existing[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Nao autorizado");
        }
        await db.update(ongProfiles).set(data).where(eq(ongProfiles.id, id));
        return { id, ...data };
      } else {
        const existing = await db
          .select()
          .from(ongProfiles)
          .where(eq(ongProfiles.userId, ctx.user.id));
        if (existing[0]) {
          await db
            .update(ongProfiles)
            .set(data)
            .where(eq(ongProfiles.userId, ctx.user.id));
          return { ...existing[0], ...data };
        } else {
          const result = await db.insert(ongProfiles).values({
            userId: ctx.user.id,
            ...data,
            status: "pending",
          });
          return { id: Number((result as unknown as { insertId: number }).insertId), userId: ctx.user.id, ...data };
        }
      }
    }),
});

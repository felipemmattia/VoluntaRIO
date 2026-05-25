// Roteador administrativo para gerenciar usuários, ONGs, eventos e categorias do sistema Plataforma VoluntaRIO.
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  users,
  ongProfiles,
  events,
  enrollments,
  categories,
  eventImages,
} from "@db/schema";
import { sendWelcomeEmail } from "./lib/email";

const SALT_ROUNDS = 10;

export const adminRouter = createRouter({
  // Obtém estatísticas gerais do sistema para o painel de administração
  stats: adminQuery.query(async () => {
    const db = getDb();
    const totalUsers = await db.select().from(users);
    const totalOngs = await db.select().from(ongProfiles);
    const totalEvents = await db.select().from(events);
    const totalEnrollments = await db.select().from(enrollments);

    return {
      totalUsers: totalUsers.length,
      totalOngs: totalOngs.length,
      totalVolunteers: totalUsers.filter((u) => u.role === "user").length,
      totalAdmins: totalUsers.filter((u) => u.role === "admin").length,
      totalOngManagers: totalUsers.filter((u) => u.role === "ong_manager").length,
      totalEvents: totalEvents.length,
      activeEvents: totalEvents.filter((e) => e.status === "active").length,
      completedEvents: totalEvents.filter((e) => e.status === "completed").length,
      totalEnrollments: totalEnrollments.length,
      pendingOngs: totalOngs.filter((o) => o.status === "pending").length,
      suspendedOngs: totalOngs.filter((o) => o.status === "suspended").length,
    };
  }),

  // Lista todos os usuários do sistema ordenados por data de criação
  listUsers: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(users).orderBy(desc(users.createdAt));
  }),

  updateUserRole: adminQuery
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["user", "admin", "ong_manager"]),
      })
    )
    // Altera o papel de acesso (role) de um usuário específico
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
      return { success: true };
    }),

  deleteUser: adminQuery
    .input(z.object({ id: z.number() }))
    // Remove permanentemente um usuário do sistema
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),

  // Lista todas as ONGs cadastradas no sistema
  listOngs: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(ongProfiles).orderBy(desc(ongProfiles.createdAt));
  }),

  updateOng: adminQuery
    .input(
      z.object({
        id: z.number(),
        displayName: z.string().min(2).max(255).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(2).optional(),
        description: z.string().max(2000).optional(),
        status: z.enum(["active", "pending", "suspended"]).optional(),
        autoAccept: z.boolean().optional(),
      })
    )
    // Atualiza as informações de cadastro e status de uma ONG
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(ongProfiles).set(data).where(eq(ongProfiles.id, id));
      return { success: true };
    }),

  deleteOng: adminQuery
    .input(z.object({ id: z.number() }))
    // Remove permanentemente uma ONG do sistema
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(ongProfiles).where(eq(ongProfiles.id, input.id));
      return { success: true };
    }),

  // Lista todos os eventos cadastrados
  listEvents: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(events).orderBy(desc(events.createdAt));
  }),

  updateEvent: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(2).max(255).optional(),
        description: z.string().max(5000).optional(),
        location: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(2).optional(),
        eventDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        maxVolunteers: z.number().int().positive().optional(),
        status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
        categoryId: z.number().optional(),
      })
    )
    // Atualiza os dados de um evento existente
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, any> = { ...data };
      if (data.eventDate) {
        updateData.eventDate = new Date(data.eventDate);
      }
      await db.update(events).set(updateData).where(eq(events.id, id));
      return { success: true };
    }),

  deleteEvent: adminQuery
    .input(z.object({ id: z.number() }))
    // Exclui um evento e todas as inscrições associadas a ele
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(enrollments).where(eq(enrollments.eventId, input.id));
      await db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),

  createCategory: adminQuery
    .input(
      z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        color: z.string().max(7).optional(),
        parentId: z.number().nullable().optional(),
      })
    )
    // Cria uma nova categoria para classificação de eventos
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(categories).values(input).$returningId();
      return { success: true, id: result[0]?.id };
    }),

  updateCategory: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(500).optional(),
        color: z.string().max(7).optional(),
        parentId: z.number().nullable().optional(),
      })
    )
    // Atualiza os dados de uma categoria de evento
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(categories).set(data).where(eq(categories.id, id));
      return { success: true };
    }),

  deleteCategory: adminQuery
    .input(z.object({ id: z.number() }))
    // Remove uma categoria de evento do sistema
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),

  createUser: adminQuery
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
        role: z.enum(["user", "admin", "ong_manager"]).default("user"),
      })
    )
    // Cadastra um novo usuário no sistema a partir do painel administrativo
    .mutation(async ({ input }) => {
      const db = getDb();

      const existing = await db.select().from(users).where(eq(users.email, input.email));
      if (existing[0]) throw new Error("Este email já está cadastrado");

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      const result = await db.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      });

      sendWelcomeEmail({ email: input.email, name: input.name, role: input.role }).catch(() => {});

      return { success: true, id: Number((result as unknown as { insertId: number }).insertId) };
    }),

  clearEventPhotos: adminQuery
    .input(z.object({ eventId: z.number() }))
    // Limpa a galeria de fotos de um evento específico
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(eventImages).where(eq(eventImages.eventId, input.eventId));
      return { success: true };
    }),

  clearUserAvatar: adminQuery
    .input(z.object({ userId: z.number() }))
    // Limpa o avatar personalizado de um usuário do sistema
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ avatar: null }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Obtém visão geral dos cadastros recentes para a página inicial do painel
  overview: adminQuery.query(async () => {
    const db = getDb();
    const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(10);
    const recentEvents = await db.select().from(events).orderBy(desc(events.createdAt)).limit(10);
    const recentOngs = await db.select().from(ongProfiles).orderBy(desc(ongProfiles.createdAt)).limit(10);

    return { recentUsers, recentEvents, recentOngs };
  }),
});

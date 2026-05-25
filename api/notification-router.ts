import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { notifications } from "@db/schema";

export const notificationRouter = createRouter({
  // Retorna a lista completa de todas as notificações do usuário logado
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt));
  }),

  // Retorna apenas as notificações não lidas do usuário logado
  listUnread: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)))
      .orderBy(desc(notifications.createdAt));
  }),

  // Marca uma notificação específica como lida pelo seu ID
  markAsRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  // Marca todas as notificações do usuário logado como lidas
  markAllAsRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),

  // Remove permanentemente uma notificação específica do banco de dados
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(notifications).where(eq(notifications.id, input.id));
      return { success: true };
    }),

  // Retorna a quantidade total de notificações pendentes (não lidas) do usuário logado
  getUnreadCount: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));
    return result.length;
  }),
});

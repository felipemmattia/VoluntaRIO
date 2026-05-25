import { z } from "zod";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { messages, users, events } from "@db/schema";
import { sendNewMessageNotification } from "./lib/email";

export const messageRouter = createRouter({
  // Retorna o histórico de mensagens trocadas entre o usuário logado e outro participante específico
  getConversation: authedQuery
    .input(z.object({ otherUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, ctx.user.id),
              eq(messages.receiverId, input.otherUserId)
            ),
            and(
              eq(messages.senderId, input.otherUserId),
              eq(messages.receiverId, ctx.user.id)
            )
          )
        )
        .orderBy(messages.createdAt);

      const userIds = [...new Set(result.map((m) => m.senderId))];
      const userData = userIds.length > 0
        ? await db.select().from(users).where(sql`${users.id} IN (${userIds.join(",")})`)
        : [];
      const userMap = new Map(userData.map((u) => [u.id, u]));

      return result.map((msg) => ({
        ...msg,
        senderName: userMap.get(msg.senderId)?.name ?? "",
        senderAvatar: userMap.get(msg.senderId)?.avatar ?? "",
      }));
    }),

  // Lista todas as conversas ativas (última mensagem de cada contato) do usuário logado
  getConversations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const allMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, ctx.user.id), eq(messages.receiverId, ctx.user.id)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<number, typeof allMessages[0]>();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === ctx.user.id ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }

    const partnerIds = [...conversationMap.keys()];
    if (partnerIds.length === 0) return [];

    const partners = await db
      .select()
      .from(users)
      .where(sql`${users.id} IN (${partnerIds.join(",")})`);
    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    return partnerIds.map((id) => {
      const lastMsg = conversationMap.get(id)!;
      const partner = partnerMap.get(id);
      return {
        partnerId: id,
        partnerName: partner?.name ?? "",
        partnerAvatar: partner?.avatar ?? "",
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.createdAt,
        unread: lastMsg.senderId === id && !lastMsg.read,
      };
    });
  }),

  // Envia uma nova mensagem direta para outro usuário da plataforma, disparando uma notificação por e-mail
  send: authedQuery
    .input(
      z.object({
        receiverId: z.number(),
        content: z.string().min(1).max(2000),
        eventId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(messages).values({
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        eventId: input.eventId,
        content: input.content,
      });

      const sender = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const receiver = await db.select().from(users).where(eq(users.id, input.receiverId));

      if (receiver[0]?.email && sender[0]) {
        let eventTitle: string | undefined;
        if (input.eventId) {
          const evt = await db.select().from(events).where(eq(events.id, input.eventId));
          eventTitle = evt[0]?.title;
        }
        sendNewMessageNotification({
          recipientEmail: receiver[0].email,
          recipientName: receiver[0].name ?? "Usuario",
          senderName: sender[0].name ?? "Usuario",
          eventTitle,
          preview: input.content,
        }).catch(() => {});
      }

      return { id: Number((result as unknown as { insertId: number }).insertId), ...input, senderId: ctx.user.id };
    }),

  // Marca todas as mensagens recebidas de um remetente específico como lidas
  markAsRead: authedQuery
    .input(z.object({ senderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(messages)
        .set({ read: true })
        .where(and(eq(messages.senderId, input.senderId), eq(messages.receiverId, ctx.user.id)));
      return { success: true };
    }),
});

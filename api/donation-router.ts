import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { donations, ongProfiles, notifications, users, events } from "@db/schema";
import { sendDonationConfirmation } from "./lib/email";

export const donationRouter = createRouter({
  // Registra uma nova doação financeira para a ONG, disparando notificações internas e e-mail de confirmação
  create: authedQuery
    .input(
      z.object({
        ongId: z.number(),
        eventId: z.number().optional(),
        amount: z.number().min(1),
        message: z.string().max(500).optional(),
        anonymous: z.boolean().optional(),
        paymentMethod: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, input.ongId));
      if (!ong[0]) throw new Error("ONG nao encontrada");

      const result = await db.insert(donations).values({
        volunteerId: ctx.user.id,
        ongId: input.ongId,
        eventId: input.eventId ?? null,
        amount: input.amount.toString(),
        message: input.message,
        anonymous: input.anonymous ?? false,
        paymentMethod: input.paymentMethod,
      });

      await db.insert(notifications).values({
        userId: ong[0].userId,
        title: "Nova Doacao Recebida",
        message: `Voce recebeu uma doacao de R$ ${input.amount.toFixed(2)}${input.anonymous ? " de um voluntario anonimo" : ""}.`,
        type: "success",
      });

      const donor = await db.select().from(users).where(eq(users.id, ctx.user.id));
      if (donor[0]) {
        let eventTitle: string | undefined;
        if (input.eventId) {
          const evt = await db.select().from(events).where(eq(events.id, input.eventId));
          eventTitle = evt[0]?.title;
        }
        sendDonationConfirmation({
          donorEmail: donor[0].email ?? "",
          donorName: donor[0].name ?? "Voluntario",
          ongName: ong[0].displayName,
          amount: input.amount,
          eventTitle,
        }).catch(() => {});
      }

      return { id: Number((result as unknown as { insertId: number }).insertId), success: true };
    }),

  // Retorna todas as doações financeiras realizadas pelo voluntário autenticado
  myDonations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(donations)
      .where(eq(donations.volunteerId, ctx.user.id))
      .orderBy(desc(donations.createdAt));
  }),

  // Retorna todas as doações recebidas por uma ONG específica (acesso restrito ao gestor ou administrador)
  byOng: authedQuery
    .input(z.object({ ongId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, input.ongId));
      if (!ong[0]) throw new Error("ONG nao encontrada");
      if (ong[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      const dons = await db
        .select()
        .from(donations)
        .where(eq(donations.ongId, input.ongId))
        .orderBy(desc(donations.createdAt));

      const volunteerIds = [...new Set(dons.map((d) => d.volunteerId))];
      const volunteerMap = new Map<number, { name: string | null }>();
      if (volunteerIds.length > 0) {
        const volunteers = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, volunteerIds[0]));
        for (const v of volunteers) {
          volunteerMap.set(v.id, { name: v.name });
        }
      }

      return dons.map((d) => ({
        ...d,
        volunteerName: d.anonymous ? "Anonimo" : volunteerMap.get(d.volunteerId)?.name ?? "Voluntario",
      }));
    }),

  // Retorna o valor acumulado total de doações recebidas por uma ONG
  ongTotal: publicQuery
    .input(z.object({ ongId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const dons = await db
        .select()
        .from(donations)
        .where(eq(donations.ongId, input.ongId));
      const total = dons.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      return { total, count: dons.length };
    }),
});

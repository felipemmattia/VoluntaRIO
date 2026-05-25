import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { enrollments, events, ongProfiles, notifications, users } from "@db/schema";
import { sendEnrollmentConfirmation, sendEnrollmentPendingEmail, sendEnrollmentRejectionEmail, sendWaitlistNotification, sendWaitlistPromotion, sendEventCancellation } from "./lib/email";

export const enrollmentRouter = createRouter({
  // Lista todas as inscrições para um determinado evento (restrito à ONG criadora ou administradores)
  listByEvent: authedQuery
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const event = await db.select().from(events).where(eq(events.id, input.eventId));
      if (!event[0]) throw new Error("Evento nao encontrado");
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      return db
        .select()
        .from(enrollments)
        .where(eq(enrollments.eventId, input.eventId))
        .orderBy(desc(enrollments.createdAt));
    }),

  // Retorna todas as inscrições realizadas pelo voluntário autenticado
  myEnrollments: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id))
      .orderBy(desc(enrollments.createdAt));

    const eventIds = [...new Set(userEnrollments.map((e) => e.eventId))];
    if (eventIds.length === 0) return [];

    const eventData = await db
      .select()
      .from(events)
      .where(sql`${events.id} IN (${eventIds.join(",")})`);
    const eventMap = new Map(eventData.map((e) => [e.id, e]));

    const ongIds = [...new Set(eventData.map((e) => e.ongId))];
    const ongData = await db
      .select()
      .from(ongProfiles)
      .where(sql`${ongProfiles.id} IN (${ongIds.join(",")})`);
    const ongMap = new Map(ongData.map((o) => [o.id, o]));

    return userEnrollments.map((enrollment) => {
      const event = eventMap.get(enrollment.eventId);
      const ong = event ? ongMap.get(event.ongId) : null;
      return {
        ...enrollment,
        eventTitle: event?.title ?? "",
        eventDate: event?.eventDate ?? null,
        eventLocation: event ? `${event.city}, ${event.state}` : "",
        ongName: ong?.displayName ?? "",
      };
    });
  }),

  // Inscreve o voluntário logado em um evento (trata limites de vagas e fila de espera automática)
  create: authedQuery
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Impedir que ONGs se inscrevam em eventos
      if (ctx.user.role === "ong_manager") {
        throw new Error("ONGs nao podem se inscrever em eventos. Use uma conta de voluntario.");
      }

      const event = await db.select().from(events).where(eq(events.id, input.eventId));
      if (!event[0]) throw new Error("Evento nao encontrado");
      if (event[0].status === "cancelled") throw new Error("Evento cancelado");
      if (event[0].status === "completed") throw new Error("Evento ja finalizado");

      // Impedir que o criador do evento se inscreva
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));
      if (ong[0]?.userId === userId) {
        throw new Error("Voce nao pode se inscrever em um evento criado por voce.");
      }

      const existing = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.eventId, input.eventId)));
      if (existing[0]) throw new Error("Voce ja esta inscrito neste evento");

      const accepted = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.eventId, input.eventId), eq(enrollments.status, "accepted")));

      const autoAccept = ong[0]?.autoAccept ?? false;

      let status: "pending" | "accepted" | "waitlist" = "pending";
      let position = 0;

      if (accepted.length >= event[0].maxVolunteers) {
        status = "waitlist";
        const waitlistCount = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.eventId, input.eventId), eq(enrollments.status, "waitlist")));
        position = waitlistCount.length + 1;
      } else if (autoAccept) {
        status = "accepted";
      }

      const result = await db.insert(enrollments).values({
        eventId: input.eventId,
        userId,
        status,
        position,
      });

      const statusMsg = status === "accepted" ? "aceita" : status === "waitlist" ? "na lista de espera" : "pendente";
      await db.insert(notifications).values({
        userId,
        title: "Inscricao Realizada",
        message: `Sua inscricao no evento "${event[0].title}" foi realizada com sucesso. Status: ${statusMsg}.`,
        type: "info",
      });

      const volunteer = await db.select().from(users).where(eq(users.id, userId));
      const volunteerEmail = volunteer[0]?.email;
      const volunteerName = volunteer[0]?.name ?? "Voluntario";

      if (status === "accepted") {
        await sendEnrollmentConfirmation({
          volunteerEmail: volunteerEmail ?? "",
          volunteerName,
          eventTitle: event[0].title,
          eventDate: event[0].eventDate?.toString() ?? "",
          accepted: true,
        });

        if (ong[0]) {
          await db.insert(notifications).values({
            userId: ong[0].userId,
            title: "Novo Voluntario",
            message: `Um novo voluntario se inscreveu no evento "${event[0].title}".`,
            type: "info",
          });
        }
      } else if (status === "waitlist") {
        await sendWaitlistNotification({
          volunteerEmail: volunteerEmail ?? "",
          volunteerName,
          eventTitle: event[0].title,
        });
      } else if (status === "pending" && volunteerEmail) {
        await sendEnrollmentPendingEmail({
          volunteerEmail,
          volunteerName,
          eventTitle: event[0].title,
          eventDate: event[0].eventDate?.toString() ?? "",
        });
      }

      return { id: Number((result as unknown as { insertId: number }).insertId), status, position };
    }),

  // Atualiza o status da inscrição (aceito, recusado ou confirmação de presença)
  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["accepted", "rejected", "present"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const enrollment = await db.select().from(enrollments).where(eq(enrollments.id, input.id));
      if (!enrollment[0]) throw new Error("Inscricao nao encontrada");

      const event = await db.select().from(events).where(eq(events.id, enrollment[0].eventId));
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0]?.ongId ?? 0));

      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      if (input.status === "present" && enrollment[0].status !== "accepted") {
        throw new Error("So e possivel confirmar presenca de voluntarios com inscricao aceita");
      }

      await db.update(enrollments).set({ status: input.status }).where(eq(enrollments.id, input.id));

      if (input.status === "present") {
        await db.insert(notifications).values({
          userId: enrollment[0].userId,
          title: "Presenca Confirmada",
          message: `Sua presenca no evento "${event[0]?.title}" foi confirmada! Agora voce pode gerar seu certificado.`,
          type: "success",
        });
      } else {
        const statusMsg = input.status === "accepted" ? "aceita" : "rejeitada";
        await db.insert(notifications).values({
          userId: enrollment[0].userId,
          title: `Inscricao ${statusMsg}`,
          message: `Sua inscricao no evento "${event[0]?.title}" foi ${statusMsg}.`,
          type: input.status === "accepted" ? "success" : "warning",
        });
      }

      const volunteer = await db.select().from(users).where(eq(users.id, enrollment[0].userId));
      const volunteerEmail = volunteer[0]?.email;
      const volunteerName = volunteer[0]?.name ?? "Voluntario";

      if (input.status === "present") {
        // Sem e-mail para confirmação de presença - o voluntário pode gerar o certificado diretamente na plataforma
      } else if (input.status === "accepted" && volunteerEmail) {
        await sendEnrollmentConfirmation({
          volunteerEmail,
          volunteerName,
          eventTitle: event[0]?.title ?? "",
          eventDate: event[0]?.eventDate?.toString() ?? "",
          accepted: true,
        });
      } else if (input.status === "rejected" && volunteerEmail) {
        await sendEnrollmentRejectionEmail({
          volunteerEmail,
          volunteerName,
          eventTitle: event[0]?.title ?? "",
        });
      }

      return { success: true };
    }),

  // Cancela a inscrição de um voluntário e promove automaticamente o próximo da fila de espera
  cancel: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const enrollment = await db.select().from(enrollments).where(eq(enrollments.id, input.id));
      if (!enrollment[0]) throw new Error("Inscricao nao encontrada");

      if (enrollment[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      const event = await db.select().from(events).where(eq(events.id, enrollment[0].eventId));

      await db.update(enrollments).set({ status: "cancelled" }).where(eq(enrollments.id, input.id));

      if (enrollment[0].status === "accepted") {
        const firstWaitlist = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.eventId, enrollment[0].eventId),
              eq(enrollments.status, "waitlist")
            )
          )
          .orderBy(enrollments.position)
          .limit(1);

        if (firstWaitlist[0]) {
          const promotionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas a partir de agora
          await db
            .update(enrollments)
            .set({ status: "accepted", position: 0, promotionExpiresAt })
            .where(eq(enrollments.id, firstWaitlist[0].id));

          await db.insert(notifications).values({
            userId: firstWaitlist[0].userId,
            title: "Vaga Liberada!",
            message: `Uma vaga foi liberada no evento "${event[0]?.title}". Voce foi promovido da lista de espera!`,
            type: "success",
          });

          const waitlistVolunteer = await db.select().from(users).where(eq(users.id, firstWaitlist[0].userId));
          const waitlistEmail = waitlistVolunteer[0]?.email;
          const waitlistName = waitlistVolunteer[0]?.name ?? "Voluntario";

          if (waitlistEmail) {
            await sendWaitlistPromotion({
              volunteerEmail: waitlistEmail,
              volunteerName: waitlistName,
              eventTitle: event[0]?.title ?? "",
              eventDate: event[0]?.eventDate?.toString() ?? "",
              acceptUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/eventos/${event[0]?.id}?accept=1`,
              declineUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/eventos/${event[0]?.id}?decline=1`,
            });
          }

          const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0]?.ongId ?? 0));
          if (ong[0]) {
            await db.insert(notifications).values({
              userId: ong[0].userId,
              title: "Promocao de Lista de Espera",
              message: `Um voluntario da lista de espera foi promovido no evento "${event[0]?.title}".`,
              type: "info",
            });
          }
        }
      }

      await db.insert(notifications).values({
        userId: enrollment[0].userId,
        title: "Inscricao Cancelada",
        message: `Sua inscricao no evento "${event[0]?.title}" foi cancelada.`,
        type: "warning",
      });

      const volunteer = await db.select().from(users).where(eq(users.id, enrollment[0].userId));
      const volunteerEmail = volunteer[0]?.email;
      const volunteerName = volunteer[0]?.name ?? "Voluntario";

      if (volunteerEmail) {
        await sendEventCancellation({
          volunteerEmail,
          volunteerName,
          eventTitle: event[0]?.title ?? "",
        });
      }

      return { success: true };
    }),

    // Retorna a contagem estatística de inscrições por status para um evento específico
  getEventStats: publicQuery
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.select().from(enrollments).where(eq(enrollments.eventId, input.eventId));

      return {
        total: all.length,
        accepted: all.filter((e) => e.status === "accepted").length,
        pending: all.filter((e) => e.status === "pending").length,
        waitlist: all.filter((e) => e.status === "waitlist").length,
        rejected: all.filter((e) => e.status === "rejected").length,
        cancelled: all.filter((e) => e.status === "cancelled").length,
      };
    }),

  // Expira promoções de fila de espera que passaram de 24 horas sem confirmação
  expirePromotions: authedQuery
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const event = await db.select().from(events).where(eq(events.id, input.eventId));
      if (!event[0]) throw new Error("Evento nao encontrado");

      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      const expiredPromotions = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.eventId, input.eventId),
            eq(enrollments.status, "accepted"),
            sql`promotionExpiresAt IS NOT NULL`,
            sql`promotionExpiresAt < NOW()`
          )
        );

      const results = [];
      for (const expired of expiredPromotions) {
        await db
          .update(enrollments)
          .set({ status: "rejected", position: 0, promotionExpiresAt: null })
          .where(eq(enrollments.id, expired.id));

        await db.insert(notifications).values({
          userId: expired.userId,
          title: "Promocao Expirada",
          message: `Sua promocao para o evento "${event[0].title}" expirou apos 24 horas sem confirmacao.`,
          type: "warning",
        });

        const nextWaitlist = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.eventId, input.eventId),
              eq(enrollments.status, "waitlist")
            )
          )
          .orderBy(enrollments.position)
          .limit(1);

        if (nextWaitlist[0]) {
          const newPromotionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await db
            .update(enrollments)
            .set({ status: "accepted", position: 0, promotionExpiresAt: newPromotionExpiresAt })
            .where(eq(enrollments.id, nextWaitlist[0].id));

          await db.insert(notifications).values({
            userId: nextWaitlist[0].userId,
            title: "Vaga Liberada!",
            message: `Uma vaga foi liberada no evento "${event[0].title}". Voce foi promovido da lista de espera! Responda em 24 horas.`,
            type: "success",
          });

          const nextVolunteer = await db.select().from(users).where(eq(users.id, nextWaitlist[0].userId));
          const nextEmail = nextVolunteer[0]?.email;
          const nextName = nextVolunteer[0]?.name ?? "Voluntario";

          if (nextEmail) {
            await sendWaitlistPromotion({
              volunteerEmail: nextEmail,
              volunteerName: nextName,
              eventTitle: event[0].title,
              eventDate: event[0].eventDate?.toString() ?? "",
              acceptUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/eventos/${event[0].id}?accept=1`,
              declineUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/eventos/${event[0].id}?decline=1`,
            });
          }
        }

        results.push({ expiredId: expired.id, promotedId: nextWaitlist[0]?.id ?? null });
      }

      return { success: true, expiredCount: results.length, results };
    }),
});

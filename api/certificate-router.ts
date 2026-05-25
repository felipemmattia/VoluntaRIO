import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { certificates, events, ongProfiles, enrollments, users } from "@db/schema";
import { nanoid } from "nanoid";
import { sendCertificateIssued } from "./lib/email";

export const certificateRouter = createRouter({
  // Gera um certificado de participação para um evento finalizado no qual o voluntário teve presença confirmada
  generate: authedQuery
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.eventId, input.eventId), eq(enrollments.userId, ctx.user.id)));

      if (!enrollment[0]) throw new Error("Voce nao participou deste evento");
      if (enrollment[0].status !== "present") throw new Error("A ONG ainda nao confirmou sua presenca neste evento");

      const event = await db.select().from(events).where(eq(events.id, input.eventId));
      if (!event[0]) throw new Error("Evento nao encontrado");

      const eventDate = new Date(event[0].eventDate);
      if (eventDate > new Date()) throw new Error("O evento ainda nao ocorreu");

      const existing = await db
        .select()
        .from(certificates)
        .where(and(eq(certificates.eventId, input.eventId), eq(certificates.volunteerId, ctx.user.id)));

      if (existing[0]) {
        return { id: existing[0].id, verificationCode: existing[0].verificationCode, alreadyExists: true };
      }

      const volunteer = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));

      const hoursContributed = event[0].duration ? parseFloat(event[0].duration) : 4;
      const verificationCode = `VR-${nanoid(12).toUpperCase()}`;

      const result = await db.insert(certificates).values({
        volunteerId: ctx.user.id,
        eventId: input.eventId,
        hoursContributed: hoursContributed.toString(),
        verificationCode,
      });

      if (volunteer[0]) {
        sendCertificateIssued({
          volunteerEmail: volunteer[0].email ?? "",
          volunteerName: volunteer[0].name ?? "Voluntario",
          eventTitle: event[0].title,
          hours: hoursContributed,
          certificateUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/certificados?code=${verificationCode}`,
        }).catch(() => {});
      }

      return {
        id: Number((result as unknown as { insertId: number }).insertId),
        verificationCode,
        alreadyExists: false,
        certificateData: {
          volunteerName: volunteer[0]?.name ?? "Voluntario",
          eventTitle: event[0].title,
          eventDate: event[0].eventDate?.toString() ?? "",
          eventLocation: `${event[0].city}, ${event[0].state}`,
          ongName: ong[0]?.displayName ?? "",
          hoursContributed,
          verificationCode,
          issuedAt: new Date().toISOString(),
        },
      };
    }),

  // Retorna todos os certificados emitidos para o voluntário autenticado
  myCertificates: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const certs = await db
      .select()
      .from(certificates)
      .where(eq(certificates.volunteerId, ctx.user.id))
      .orderBy(desc(certificates.issuedAt));

    const eventIds = [...new Set(certs.map((c) => c.eventId))];
    if (eventIds.length === 0) return [];

      const eventData = await db.select().from(events).where(sql`${events.id} IN (${eventIds.join(",")})`);
    const eventMap = new Map(eventData.map((e) => [e.id, e]));

    return certs.map((c) => ({
      ...c,
      eventTitle: eventMap.get(c.eventId)?.title ?? "",
      eventDate: eventMap.get(c.eventId)?.eventDate ?? null,
    }));
  }),

  // Rota pública para verificar a autenticidade de um certificado através de seu código de verificação único
  verify: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const cert = await db
        .select()
        .from(certificates)
        .where(eq(certificates.verificationCode, input.code));

      if (!cert[0]) return { valid: false };

      const volunteer = await db.select().from(users).where(eq(users.id, cert[0].volunteerId));
      const event = await db.select().from(events).where(eq(events.id, cert[0].eventId));

      return {
        valid: true,
        volunteerName: volunteer[0]?.name ?? "",
        eventTitle: event[0]?.title ?? "",
        eventDate: event[0]?.eventDate?.toString() ?? "",
        hoursContributed: cert[0].hoursContributed,
        issuedAt: cert[0].issuedAt,
      };
    }),

  // Retorna estatísticas de participação do voluntário logado (certificados totais, horas totais acumuladas e futuros eventos)
  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const certs = await db
      .select()
      .from(certificates)
      .where(eq(certificates.volunteerId, ctx.user.id));

    const enrollmentsList = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id));

    const acceptedEnrollments = enrollmentsList.filter((e) => e.status === "accepted");
    const eventIds = acceptedEnrollments.map((e) => e.eventId);

    let totalHours = 0;
    if (eventIds.length > 0) {
    const eventData = await db.select().from(events).where(sql`${events.id} IN (${eventIds.join(",")})`);
      for (const ev of eventData) {
        totalHours += ev.duration ? parseFloat(ev.duration) : 4;
      }
    }

    const upcoming = enrollmentsList.filter((e) => {
      const ev = eventIds.includes(e.eventId);
      return e.status === "accepted" && ev;
    }).length;

    return {
      totalCertificates: certs.length,
      totalEventsParticipated: acceptedEnrollments.length,
      totalHoursContributed: totalHours,
      upcomingEvents: upcoming,
    };
  }),
});

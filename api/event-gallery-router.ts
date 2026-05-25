import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eventImages, events, ongProfiles } from "@db/schema";

export const eventGalleryRouter = createRouter({
  // Lista todas as imagens associadas à galeria de fotos de um determinado evento
  list: publicQuery
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(eventImages)
        .where(eq(eventImages.eventId, input.eventId))
        .orderBy(eventImages.isMain, eventImages.createdAt);
    }),

  // Adiciona uma nova imagem à galeria do evento (restrito à ONG organizadora ou administrador)
  add: authedQuery
    .input(
      z.object({
        eventId: z.number(),
        imageBase64: z.string(),
        caption: z.string().max(255).optional(),
        isMain: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const event = await db.select().from(events).where(eq(events.id, input.eventId));
      if (!event[0]) throw new Error("Evento nao encontrado");

      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      const result = await db.insert(eventImages).values({
        eventId: input.eventId,
        imageUrl: input.imageBase64,
        caption: input.caption,
        isMain: input.isMain ?? false,
      });

      return { id: Number((result as unknown as { insertId: number }).insertId) };
    }),

  // Remove permanentemente uma imagem da galeria (restrito à ONG organizadora ou administrador)
  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const image = await db.select().from(eventImages).where(eq(eventImages.id, input.id));
      if (!image[0]) throw new Error("Imagem nao encontrada");

      const event = await db.select().from(events).where(eq(events.id, image[0].eventId));
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0]?.ongId ?? 0));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      await db.delete(eventImages).where(eq(eventImages.id, input.id));
      return { success: true };
    }),

  // Define uma imagem específica como a capa principal do evento
  setMain: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const image = await db.select().from(eventImages).where(eq(eventImages.id, input.id));
      if (!image[0]) throw new Error("Imagem nao encontrada");

      const event = await db.select().from(events).where(eq(events.id, image[0].eventId));
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0]?.ongId ?? 0));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      await db
        .update(eventImages)
        .set({ isMain: false })
        .where(eq(eventImages.eventId, image[0].eventId));

      await db
        .update(eventImages)
        .set({ isMain: true })
        .where(eq(eventImages.id, input.id));

      return { success: true };
    }),
});

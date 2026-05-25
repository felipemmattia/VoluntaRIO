import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";

export const uploadRouter = createRouter({
  // Gera um caminho local sanitizado e único para o upload de arquivos baseado no tipo (avatar, event ou gallery)
  getUrl: authedQuery
    .input(
      z.object({
        filename: z.string(),
        type: z.enum(["avatar", "event", "gallery"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const timestamp = Date.now();
      const safeName = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueName = `${ctx.user.id}_${timestamp}_${safeName}`;
      const subDir = input.type === "avatar" ? "avatars" : input.type === "event" ? "events" : "gallery";
      const filePath = `/uploads/${subDir}/${uniqueName}`;

      return { uploadUrl: filePath, fullPath: filePath };
    }),

  // Salva a URL da imagem enviada como o avatar do voluntário/gestor autenticado no momento
  saveAvatar: authedQuery
    .input(
      z.object({
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ avatar: input.imageUrl })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});

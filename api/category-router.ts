import { z } from "zod";
import { eq, isNull } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories } from "@db/schema";

export const categoryRouter = createRouter({
  // Lista todas as categorias e subcategorias marinhas registradas
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories);
  }),

  // Lista categorias pai agrupando suas respectivas subcategorias para exibição em árvore
  listWithSubcategories: publicQuery.query(async () => {
    const db = getDb();
    const allCategories = await db.select().from(categories);
    const parents = allCategories.filter((c) => !c.parentId);
    return parents.map((parent) => ({
      ...parent,
      subcategories: allCategories.filter((c) => c.parentId === parent.id),
    }));
  }),

  // Busca os dados de uma categoria específica através de seu ID único
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(categories).where(eq(categories.id, input.id));
      return result[0] ?? null;
    }),

  // Retorna apenas as categorias principais (sem categoria pai/parentId nulo)
  getParentCategories: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories).where(isNull(categories.parentId));
  }),

  // Cria uma nova categoria ou subcategoria (acesso restrito a administradores)
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        parentId: z.number().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(categories).values(input);
      return { id: Number((result as unknown as { insertId: number }).insertId), ...input };
    }),

  // Permite atualizar os dados de uma categoria (acesso restrito a administradores)
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(categories).set(data).where(eq(categories.id, id));
      return { id, ...data };
    }),
});

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { events, enrollments, ongProfiles, categories, eventImages, notifications, users } from "@db/schema";
import { sendEventCancellation, sendEventUpdateNotification } from "./lib/email";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

// Coordenadas aproximadas de capitais e cidades principais para geocodificacao fallback
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "sao paulo": { lat: -23.5505, lon: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729 },
  "salvador": { lat: -12.9714, lon: -38.5124 },
  "fortaleza": { lat: -3.7172, lon: -38.5433 },
  "brasilia": { lat: -15.7939, lon: -47.8828 },
  "belo horizonte": { lat: -19.9167, lon: -43.9345 },
  "manaus": { lat: -3.1190, lon: -60.0217 },
  "curitiba": { lat: -25.4284, lon: -49.2733 },
  "recife": { lat: -8.0476, lon: -34.8770 },
  "porto alegre": { lat: -30.0346, lon: -51.2177 },
  "belem": { lat: -1.4558, lon: -48.5039 },
  "goiania": { lat: -16.6869, lon: -49.2648 },
  "guarulhos": { lat: -23.4538, lon: -46.5333 },
  "campinas": { lat: -22.9099, lon: -47.0626 },
  "florianopolis": { lat: -27.5954, lon: -48.5480 },
  "vitoria": { lat: -20.3155, lon: -40.3128 },
  "natal": { lat: -5.7945, lon: -35.2110 },
  "joao pessoa": { lat: -7.1195, lon: -34.8450 },
  "maceio": { lat: -9.6658, lon: -35.7353 },
  "teresina": { lat: -5.0892, lon: -42.8019 },
  "campo grande": { lat: -20.4428, lon: -54.6464 },
  "cuiaba": { lat: -15.5989, lon: -56.0949 },
  "aracaju": { lat: -10.9472, lon: -37.0731 },
  "sao luis": { lat: -2.5387, lon: -44.2825 },
  "palmas": { lat: -10.1841, lon: -48.3336 },
  "rio branco": { lat: -9.9747, lon: -67.8100 },
  "macapa": { lat: 0.0389, lon: -51.0664 },
  "boa vista": { lat: 2.8235, lon: -60.6758 },
  "porto velho": { lat: -8.7612, lon: -63.9004 },
  "araraquara": { lat: -21.7949, lon: -48.1758 },
  "sao carlos": { lat: -22.0179, lon: -47.8863 },
  "ribeirao preto": { lat: -21.1775, lon: -47.8104 },
  "sao jose dos campos": { lat: -23.1895, lon: -45.8841 },
  "santos": { lat: -23.9608, lon: -46.3336 },
  "niteroi": { lat: -22.8832, lon: -43.1034 },
  "sao bernardo do campo": { lat: -23.6938, lon: -46.5650 },
  "santo andre": { lat: -23.6637, lon: -46.5383 },
  "osasco": { lat: -23.5324, lon: -46.7917 },
  "sorocaba": { lat: -23.5017, lon: -47.4526 },
  "piracicaba": { lat: -22.7253, lon: -47.6492 },
  "jundiai": { lat: -23.1863, lon: -46.8842 },
  "americana": { lat: -22.7395, lon: -47.3310 },
  "londrina": { lat: -23.3103, lon: -51.1628 },
  "maringa": { lat: -23.4208, lon: -51.9338 },
  "joinville": { lat: -26.3045, lon: -48.8453 },
  "blumenau": { lat: -26.9189, lon: -49.0658 },
};

// Fórmula de Haversine para cálculo de distância em quilômetros entre duas coordenadas (lat/lon)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const listInput = z.object({
  categoryId: z.number().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  experienceLevel: z.string().optional(),
  search: z.string().optional(),
  userLat: z.number().optional(),
  userLon: z.number().optional(),
  sortBy: z.enum(["distance", "date", "newest"]).optional().default("distance"),
});

export const eventRouter = createRouter({
  // Lista eventos ativos da plataforma com suporte a múltiplos filtros (pesquisa textual, nível, categoria, cidade) e ordenação por distância
  list: publicQuery
    .input(listInput.optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = input ?? { sortBy: "distance" };

      const allEvents = await db
        .select()
        .from(events)
        .where(eq(events.status, "active"))
        .orderBy(desc(events.eventDate));

      const ongIds = [...new Set(allEvents.map((e) => e.ongId))];
      const ongData = ongIds.length > 0
        ? await db.select().from(ongProfiles).where(sql`${ongProfiles.id} IN (${ongIds.join(",")})`)
        : [];
      const ongMap = new Map(ongData.map((o) => [o.id, o]));

      const catIds = [...new Set(allEvents.map((e) => e.categoryId))];
      const catData = catIds.length > 0
        ? await db.select().from(categories).where(sql`${categories.id} IN (${catIds.join(",")})`)
        : [];
      const catMap = new Map(catData.map((c) => [c.id, c]));

      const eventIds = allEvents.map((e) => e.id);
      const enrollmentCounts = eventIds.length > 0
        ? await db
          .select({
            eventId: enrollments.eventId,
            count: sql<number>`count(*)`,
          })
          .from(enrollments)
          .where(
            and(
              sql`${enrollments.eventId} IN (${eventIds.join(",")})`,
              eq(enrollments.status, "accepted")
            )
          )
          .groupBy(enrollments.eventId)
        : [];
      const enrollmentMap = new Map(enrollmentCounts.map((e) => [e.eventId, e.count]));

      const eventImagesData = eventIds.length > 0
        ? await db.select().from(eventImages).where(sql`${eventImages.eventId} IN (${eventIds.join(",")})`)
        : [];
      const mainImageMap = new Map<number, string>();
      for (const img of eventImagesData) {
        if (!mainImageMap.has(img.eventId) || img.isMain) {
          mainImageMap.set(img.eventId, img.imageUrl);
        }
      }

      let filtered = allEvents;

      if (filters.categoryId) {
        filtered = filtered.filter((e) => e.categoryId === filters.categoryId);
      }
      if (filters.state) {
        const stateFilter = filters.state;
        filtered = filtered.filter((e) => e.state?.toLowerCase() === stateFilter.toLowerCase());
      }
      if (filters.city) {
        filtered = filtered.filter((e) =>
          e.city?.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }
      if (filters.experienceLevel) {
        filtered = filtered.filter((e) => e.experienceLevel === filters.experienceLevel || e.experienceLevel === "todos");
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(searchLower) ||
            e.description.toLowerCase().includes(searchLower) ||
            e.city?.toLowerCase().includes(searchLower) ||
            e.state?.toLowerCase().includes(searchLower)
        );
      }

      const eventsWithMeta = filtered.map((event) => {
        const ong = ongMap.get(event.ongId);
        const category = catMap.get(event.categoryId);
        const enrolled = enrollmentMap.get(event.id) ?? 0;
        const lat = event.latitude ? parseFloat(event.latitude.toString()) : null;
        const lon = event.longitude ? parseFloat(event.longitude.toString()) : null;
        const distance =
          filters.userLat && filters.userLon && lat && lon
            ? haversine(filters.userLat, filters.userLon, lat, lon)
            : null;

        return {
          ...event,
          ongName: ong?.displayName ?? "",
          categoryName: category?.name ?? "",
          categoryColor: category?.color ?? "",
          enrolledCount: enrolled,
          spotsLeft: event.maxVolunteers - enrolled,
          distance,
          mainImageUrl: mainImageMap.get(event.id) ?? null,
        };
      });

      if (filters.sortBy === "distance" && filters.userLat && filters.userLon) {
        eventsWithMeta.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      } else if (filters.sortBy === "newest") {
        eventsWithMeta.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        eventsWithMeta.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      }

      return eventsWithMeta;
    }),

  // Retorna os detalhes de um evento específico por seu ID único, com dados da categoria, fotos e contagem de vagas
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const eventResult = await db.select().from(events).where(eq(events.id, input.id));
      if (!eventResult[0]) return null;

      const event = eventResult[0];
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event.ongId));
      const category = await db.select().from(categories).where(eq(categories.id, event.categoryId));
      const images = await db.select().from(eventImages).where(eq(eventImages.eventId, event.id));
      const enrolled = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.eventId, event.id), eq(enrollments.status, "accepted")));

      let ongAvatar: string | null = null;
      if (ong[0]?.userId) {
        const ongUser = await db.select({ avatar: users.avatar }).from(users).where(eq(users.id, ong[0].userId));
        ongAvatar = ongUser[0]?.avatar ?? null;
      }

      return {
        ...event,
        ong: ong[0] ? { ...ong[0], avatar: ongAvatar } : null,
        category: category[0] ?? null,
        images,
        enrolledCount: enrolled.length,
        spotsLeft: event.maxVolunteers - enrolled.length,
      };
    }),

  // Lista todos os eventos cadastrados por uma ONG específica (ativos, cancelados, concluídos, etc.)
  listByOng: publicQuery
    .input(z.object({ ongId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(events).where(eq(events.ongId, input.ongId)).orderBy(desc(events.eventDate));
    }),

  // Cria um novo evento de voluntariado com geocodificação fallback baseada na cidade ou coordenadas da ONG
  create: authedQuery
    .input(
      z.object({
        categoryId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().min(1),
        requirements: z.string().optional(),
        experienceLevel: z.enum(["iniciante", "intermediario", "avancado", "todos"]).default("todos"),
        eventDate: z.string(),
        eventTime: z.string().optional(),
        duration: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.enum(BRAZIL_STATES),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        locationName: z.string().optional(),
        address: z.string().optional(),
        maxVolunteers: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.userId, ctx.user.id));
      if (!ong[0]) throw new Error("Perfil de ONG nao encontrado");

      // Geocodificacao automatica: tenta coordenadas explicitas, depois cidade, depois perfil da ONG
      let latitude = input.latitude;
      let longitude = input.longitude;

      if (!latitude || !longitude) {
        const cityKey = input.city?.toLowerCase().trim();
        if (cityKey && CITY_COORDS[cityKey]) {
          latitude = String(CITY_COORDS[cityKey].lat);
          longitude = String(CITY_COORDS[cityKey].lon);
        } else if (ong[0].latitude && ong[0].longitude) {
          latitude = ong[0].latitude;
          longitude = ong[0].longitude;
        }
      }

      const result = await db.insert(events).values({
        ongId: ong[0].id,
        ...input,
        latitude,
        longitude,
        eventDate: new Date(input.eventDate),
      });

      return { id: Number((result as unknown as { insertId: number }).insertId), ...input };
    }),

  // Atualiza as informações do evento e notifica voluntários inscritos por e-mail/notificações internas caso ocorram mudanças importantes (data/hora/local)
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        requirements: z.string().optional(),
        experienceLevel: z.enum(["iniciante", "intermediario", "avancado", "todos"]).optional(),
        eventDate: z.string().optional(),
        eventTime: z.string().optional(),
        duration: z.string().optional(),
        city: z.string().min(1).max(100).optional(),
        state: z.enum(BRAZIL_STATES).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        locationName: z.string().optional(),
        address: z.string().optional(),
        maxVolunteers: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const event = await db.select().from(events).where(eq(events.id, id));
      if (!event[0]) throw new Error("Evento nao encontrado");

      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      const oldEvent = event[0];
      const updateData: Record<string, unknown> = { ...data };
      if (data.eventDate) updateData.eventDate = new Date(data.eventDate);

      await db.update(events).set(updateData).where(eq(events.id, id));

      const changes: string[] = [];
      if (data.eventDate && data.eventDate !== oldEvent.eventDate?.toISOString().split("T")[0]) {
        changes.push(`Data alterada para ${data.eventDate}`);
      }
      if (data.eventTime && data.eventTime !== oldEvent.eventTime) {
        changes.push(`Horario alterado para ${data.eventTime}`);
      }
      if ((data.city && data.city !== oldEvent.city) || (data.state && data.state !== oldEvent.state)) {
        changes.push(`Local alterado para ${data.city ?? oldEvent.city}, ${data.state ?? oldEvent.state}`);
      }

      if (changes.length > 0) {
        const enrolledVolunteers = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.eventId, id), eq(enrollments.status, "accepted")));

        for (const enrollment of enrolledVolunteers) {
          await db.insert(notifications).values({
            userId: enrollment.userId,
            title: "Evento Atualizado",
            message: `O evento "${oldEvent.title}" foi atualizado: ${changes.join("; ")}.`,
            type: "info",
            link: `/eventos/${id}`,
          });

          const volunteer = await db.select().from(users).where(eq(users.id, enrollment.userId));
          const volunteerEmail = volunteer[0]?.email;
          const volunteerName = volunteer[0]?.name ?? "Voluntario";

          if (volunteerEmail) {
            sendEventUpdateNotification({
              volunteerEmail,
              volunteerName,
              eventTitle: oldEvent.title,
              changes,
            }).catch(() => { });
          }
        }
      }

      return { id, ...updateData };
    }),

  // Remove um evento, atualiza o status de inscrições associadas para cancelado e envia e-mails informativos
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const event = await db.select().from(events).where(eq(events.id, input.id));
      if (!event[0]) throw new Error("Evento nao encontrado");

      const ong = await db.select().from(ongProfiles).where(eq(ongProfiles.id, event[0].ongId));
      if (ong[0]?.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Nao autorizado");
      }

      const enrolledVolunteers = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.eventId, input.id), eq(enrollments.status, "accepted")));

      await db.update(enrollments).set({ status: "cancelled" }).where(eq(enrollments.eventId, input.id));

      for (const enrollment of enrolledVolunteers) {
        await db.insert(notifications).values({
          userId: enrollment.userId,
          title: "Evento Cancelado",
          message: `O evento "${event[0].title}" foi cancelado pela ONG organizadora. Sua inscricao foi automaticamente cancelada.`,
          type: "warning",
        });

        const volunteer = await db.select().from(users).where(eq(users.id, enrollment.userId));
        const volunteerEmail = volunteer[0]?.email;
        const volunteerName = volunteer[0]?.name ?? "Voluntario";

        if (volunteerEmail) {
          await sendEventCancellation({
            volunteerEmail,
            volunteerName,
            eventTitle: event[0].title,
          });
        }
      }

      await db.delete(eventImages).where(eq(eventImages.eventId, input.id));
      await db.delete(events).where(eq(events.id, input.id));

      return { success: true };
    }),

  // Recomenda eventos próximos com base nos interesses prévios de participação do voluntário e geolocalização
  recommend: publicQuery
    .input(
      z.object({
        userId: z.number().optional(),
        userLat: z.number(),
        userLon: z.number(),
        categoryIds: z.array(z.number()).optional(),
        limit: z.number().optional().default(6),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const activeEvents = await db.select().from(events).where(eq(events.status, "active"));

      const ongIds = [...new Set(activeEvents.map((e) => e.ongId))];
      const ongData = ongIds.length > 0
        ? await db.select().from(ongProfiles).where(sql`${ongProfiles.id} IN (${ongIds.join(",")})`)
        : [];
      const ongMap = new Map(ongData.map((o) => [o.id, o]));

      const catData = await db.select().from(categories);
      const catMap = new Map(catData.map((c) => [c.id, c]));

      const eventIds = activeEvents.map((e) => e.id);
      const enrollmentCounts = eventIds.length > 0
        ? await db
          .select({ eventId: enrollments.eventId, count: sql<number>`count(*)`, })
          .from(enrollments)
          .where(and(sql`${enrollments.eventId} IN (${eventIds.join(",")})`, eq(enrollments.status, "accepted")))
          .groupBy(enrollments.eventId)
        : [];
      const enrollmentMap = new Map(enrollmentCounts.map((e) => [e.eventId, e.count]));

      let userCategories: number[] = input.categoryIds ?? [];
      if (input.userId && userCategories.length === 0) {
        const pastEnrollments = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.userId, input.userId), eq(enrollments.status, "accepted")));
        const pastEventIds = pastEnrollments.map((e) => e.eventId);
        if (pastEventIds.length > 0) {
          const pastEvents = await db
            .select()
            .from(events)
            .where(sql`${events.id} IN (${pastEventIds.join(",")})`);
          userCategories = [...new Set(pastEvents.map((e) => e.categoryId))];
        }
      }

      const scored = activeEvents.map((event) => {
        const lat = event.latitude ? parseFloat(event.latitude.toString()) : null;
        const lon = event.longitude ? parseFloat(event.longitude.toString()) : null;
        const distance = lat && lon
          ? haversine(input.userLat, input.userLon, lat, lon)
          : null;

        const distanceScore = distance !== null ? Math.max(0, 80 - (distance / 100) * 80) : 0;
        const isInterestMatch = userCategories.includes(event.categoryId);
        const interestScore = isInterestMatch ? 20 : 0;
        const enrolled = enrollmentMap.get(event.id) ?? 0;
        const ong = ongMap.get(event.ongId);
        const category = catMap.get(event.categoryId);

        return {
          ...event,
          ongName: ong?.displayName ?? "",
          categoryName: category?.name ?? "",
          categoryColor: category?.color ?? "",
          enrolledCount: enrolled,
          spotsLeft: event.maxVolunteers - enrolled,
          distance,
          score: distanceScore + interestScore,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, input.limit);
    }),
});

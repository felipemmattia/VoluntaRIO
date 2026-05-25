import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  longtext,
  timestamp,
  bigint,
  int,
  decimal,
  boolean,
  date,
  time,
} from "drizzle-orm/mysql-core";

// ─── Usuários (tabela base de autenticação — estendida via perfis) ──────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin", "ong_manager"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categorias de Causas Marinhas ────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentId: bigint("parentId", { mode: "number", unsigned: true }),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── Perfis de Voluntários ──────────────────────────────────────────────────────
export const volunteerProfiles = mysqlTable("volunteer_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  bio: text("bio"),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  certifications: text("certifications"),
  experience: text("experience"),
  interests: text("interests"), // Array JSON com os IDs das categorias de interesse
  shareLocation: boolean("shareLocation").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type VolunteerProfile = typeof volunteerProfiles.$inferSelect;

// ─── Perfis de ONGs ─────────────────────────────────────────────────────────────
export const ongProfiles = mysqlTable("ong_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 18 }),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  mission: text("mission"),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  address: text("address"),
  autoAccept: boolean("autoAccept").default(false).notNull(),
  status: mysqlEnum("status", ["active", "suspended", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type OngProfile = typeof ongProfiles.$inferSelect;

// ─── Eventos ──────────────────────────────────────────────────────────────────
export const events = mysqlTable("events", {
  id: serial("id").primaryKey(),
  ongId: bigint("ongId", { mode: "number", unsigned: true }).notNull(),
  categoryId: bigint("categoryId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  experienceLevel: mysqlEnum("experienceLevel", ["iniciante", "intermediario", "avancado", "todos"]).default("todos").notNull(),
  eventDate: date("eventDate").notNull(),
  eventTime: time("eventTime"),
  duration: varchar("duration", { length: 50 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  locationName: varchar("locationName", { length: 255 }),
  address: text("address"),
  maxVolunteers: int("maxVolunteers").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "completed", "full"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Event = typeof events.$inferSelect;

// ─── Inscrições ───────────────────────────────────────────────────────────────
export const enrollments = mysqlTable("enrollments", {
  id: serial("id").primaryKey(),
  eventId: bigint("eventId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "waitlist", "cancelled", "present"]).default("pending").notNull(),
  position: int("position").default(0), // Posição na fila de espera
  promotionExpiresAt: timestamp("promotionExpiresAt"), // Expiração de 24 horas para promoções da fila de espera
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Enrollment = typeof enrollments.$inferSelect;

// ─── Notificações ─────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  read: boolean("read").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Mensagens ────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  senderId: bigint("senderId", { mode: "number", unsigned: true }).notNull(),
  receiverId: bigint("receiverId", { mode: "number", unsigned: true }).notNull(),
  eventId: bigint("eventId", { mode: "number", unsigned: true }),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ─── Event Images ─────────────────────────────────────────────────────────────
export const eventImages = mysqlTable("event_images", {
  id: serial("id").primaryKey(),
  eventId: bigint("eventId", { mode: "number", unsigned: true }).notNull(),
  imageUrl: longtext("imageUrl").notNull(),
  caption: varchar("caption", { length: 255 }),
  isMain: boolean("isMain").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventImage = typeof eventImages.$inferSelect;

// ─── Estatísticas da Plataforma ───────────────────────────────────────────────
export const platformStats = mysqlTable("platform_stats", {
  id: serial("id").primaryKey(),
  totalVolunteers: int("totalVolunteers").default(0).notNull(),
  totalOngs: int("totalOngs").default(0).notNull(),
  totalEvents: int("totalEvents").default(0).notNull(),
  totalEnrollments: int("totalEnrollments").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type PlatformStat = typeof platformStats.$inferSelect;

// ─── Doacoes ──────────────────────────────────────────────────────────────────
export const donations = mysqlTable("donations", {
  id: serial("id").primaryKey(),
  volunteerId: bigint("volunteerId", { mode: "number", unsigned: true }).notNull(),
  ongId: bigint("ongId", { mode: "number", unsigned: true }).notNull(),
  eventId: bigint("eventId", { mode: "number", unsigned: true }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  anonymous: boolean("anonymous").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("completed").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Donation = typeof donations.$inferSelect;

// ─── Certificados ─────────────────────────────────────────────────────────────
export const certificates = mysqlTable("certificates", {
  id: serial("id").primaryKey(),
  volunteerId: bigint("volunteerId", { mode: "number", unsigned: true }).notNull(),
  eventId: bigint("eventId", { mode: "number", unsigned: true }).notNull(),
  certificateUrl: text("certificateUrl"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  hoursContributed: decimal("hoursContributed", { precision: 5, scale: 2 }),
  verificationCode: varchar("verificationCode", { length: 50 }).notNull().unique(),
});

export type Certificate = typeof certificates.$inferSelect;

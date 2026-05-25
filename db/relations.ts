import { relations } from "drizzle-orm";
import {
  users,
  volunteerProfiles,
  ongProfiles,
  categories,
  events,
  enrollments,
  notifications,
  messages,
  eventImages,
  certificates,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  volunteerProfile: one(volunteerProfiles, {
    fields: [users.id],
    references: [volunteerProfiles.userId],
  }),
  ongProfile: one(ongProfiles, {
    fields: [users.id],
    references: [ongProfiles.userId],
  }),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent",
  }),
  children: many(categories, { relationName: "parent" }),
  events: many(events),
}));

export const ongProfilesRelations = relations(ongProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [ongProfiles.userId],
    references: [users.id],
  }),
  events: many(events),
}));

export const volunteerProfilesRelations = relations(volunteerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [volunteerProfiles.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  ong: one(ongProfiles, {
    fields: [events.ongId],
    references: [ongProfiles.id],
  }),
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  enrollments: many(enrollments),
  images: many(eventImages),
  messages: many(messages),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  event: one(events, {
    fields: [enrollments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
  event: one(events, {
    fields: [messages.eventId],
    references: [events.id],
  }),
}));

export const eventImagesRelations = relations(eventImages, ({ one }) => ({
  event: one(events, {
    fields: [eventImages.eventId],
    references: [events.id],
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  volunteer: one(users, {
    fields: [certificates.volunteerId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [certificates.eventId],
    references: [events.id],
  }),
}));

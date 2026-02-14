import { relations } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./user";

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});


export const roleRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
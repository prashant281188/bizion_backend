import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
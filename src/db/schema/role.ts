import { relations } from "drizzle-orm";
import { boolean, pgTable, uuid, text } from "drizzle-orm/pg-core";
import { users } from "./user";

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  isSystem: boolean("is_system").default(false).notNull(), // system roles cannot be deleted or have permissions changed
});


export const roleRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));



export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
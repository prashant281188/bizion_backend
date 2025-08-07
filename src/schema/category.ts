import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"

export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryName: varchar("categoryName", { length: 100 }).notNull().unique(),
  categoryDescription: varchar("categoryDescription", { length: 100 }),
});

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
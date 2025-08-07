import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"

export const groups = pgTable("groups", {
  id: uuid().primaryKey().defaultRandom(),
  groupName: varchar().unique().notNull(),
  groupDescription: varchar()
})

export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
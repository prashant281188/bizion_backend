import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
export const units = pgTable("units", {
  id: uuid().primaryKey().defaultRandom(),
  unitShortName: varchar().notNull(),
  unitLongName: varchar().notNull()
})

export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
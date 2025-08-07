import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"


export const hsns = pgTable("hsns", {
  id: uuid().primaryKey().defaultRandom(),
  hsnCode: numeric({ mode: "number" }).notNull(),
  hsnDescription: varchar().default("").notNull()
})

export type HSN = typeof hsns.$inferSelect
export type NewHSN = typeof hsns.$inferInsert
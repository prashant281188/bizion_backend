import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
export const taxes = pgTable("taxes", {
  id: uuid().primaryKey().defaultRandom(),
  taxValue: numeric({ mode: "number" }).notNull(),
  taxName: varchar().default("").notNull()
})

export type Tax = typeof taxes.$inferSelect
export type NewTax = typeof taxes.$inferInsert
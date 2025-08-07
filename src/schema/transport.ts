import { relations } from "drizzle-orm"
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { parties } from "./party"

export const transports = pgTable("transports", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar(),
  gstin: varchar(),
  contact: varchar()
})

export type Transport = typeof transports.$inferSelect
export type NewTransport = typeof transports.$inferInsert

export const trasnportRelation = relations(transports, ({ many }) => ({
  parties: many(parties),
}))
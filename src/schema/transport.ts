import { 
   relations } from "drizzle-orm"
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { parties } from "./party"
import z from "zod"

export const transports = pgTable("transports", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  gstin: varchar().unique(),
  contact: varchar()
})

// --------------------------RELATIONS-----------------------------//

export const trasnportRelation = relations(transports, ({ many }) => ({
  parties: many(parties),
}))


export const transportSchema = z.object({
  name: z.string().min(1, { message: "trasnport name is required" }),
  gstin: z.string().nullable().optional(),
  contact: z.string().nullable().optional()
})

export const transportUpdateSchema = transportSchema.extend({
  id: z.string().uuid()
})

export type Transport = z.infer<typeof transportSchema>
export type TrasnportUpdate = z.infer<typeof transportUpdateSchema>
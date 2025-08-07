import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import z from "zod"

export const hsns = pgTable("hsns", {
  id: uuid().primaryKey().defaultRandom(),
  hsnCode: varchar().notNull().unique(),
  hsnDescription: varchar()
})

export const hsnSchema = z.object({
  hsnCode: z.string().min(1, { message: "hsn code is required" }),
  hsnDescription: z.string().nullable().optional()
})

export const hsnUpdateSchema = hsnSchema.extend({
  id: z.string().uuid()
})

export type HSN = z.infer<typeof hsnSchema>
export type HSNUpdate = z.infer<typeof hsnUpdateSchema>
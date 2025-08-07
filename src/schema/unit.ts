import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import z from "zod"
export const units = pgTable("units", {
  id: uuid().primaryKey().defaultRandom(),
  unitShortName: varchar().notNull().unique(),
  unitLongName: varchar().notNull().unique()
})


export const unitSchema = z.object({
  unitShortName: z.string().min(1, { message: "Unit Short Name is required" }),
  unitLongName: z.string().min(1, { message: "Unit Long Name is required" }),
})


export const unitUpdateSchema = unitSchema.extend({
  id: z.string().uuid()
})

export type UnitUpdate = z.infer<typeof unitUpdateSchema>
export type Unit = z.infer<typeof unitSchema>
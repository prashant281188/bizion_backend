import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import z from "zod"
export const taxes = pgTable("taxes", {
  id: uuid().primaryKey().defaultRandom(),
  taxName: varchar().notNull().unique(),
  taxValue: numeric({ mode: "number" }).notNull(),
  cgst: numeric({ mode: "number" }).notNull(),
  igst: numeric({ mode: "number" }).notNull(),
  sgst: numeric({ mode: "number" }).notNull(),
})


export const taxSchema = z.object({
  taxName: z.string().min(1, { message: "tax name is required" }),
  taxValue: z.coerce.number().max(100, { message: "tax value cannot be greater than 100" }).nonnegative({ message: "tax value cannot be less than 0" }),
  cgst: z.coerce.number().max(100, { message: "tax value cannot be greater than 100" }).nonnegative({ message: "tax value cannot be less than 0" }),
  igst: z.coerce.number().max(100, { message: "tax value cannot be greater than 100" }).nonnegative({ message: "tax value cannot be less than 0" }),
  sgst: z.coerce.number().max(100, { message: "tax value cannot be greater than 100" }).nonnegative({ message: "tax value cannot be less than 0" })
})

export const taxUpdateSchema = taxSchema.extend({
  id: z.string().uuid()
})

export type TaxUpdate = z.infer<typeof taxUpdateSchema>
export type Tax = z.infer<typeof taxSchema>
export type TaxRecord = TaxUpdate

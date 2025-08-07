import { pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import z from "zod"

export const groups = pgTable("groups", {
  id: uuid().primaryKey().defaultRandom(),
  groupName: varchar().unique().notNull(),
  groupDescription: varchar()
})

export const groupSchema = z.object({
  groupName: z.string().min(1, { message: "group name is required" }),
  groupDescription: z.string().nullable().optional()
})

export const groupUpdateSchema = groupSchema.extend({
  id: z.string().uuid()
})

export type Group = z.infer<typeof groupSchema>
export type GroupUpdate = z.infer<typeof groupUpdateSchema>
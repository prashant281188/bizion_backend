import { relations } from "drizzle-orm"
import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { transports } from "./transport"
import { groups } from "./group"
import z from "zod"

export const parties = pgTable("parties", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  gstin: varchar().unique(),
  contact: varchar().unique().notNull(),
  addressLine1: varchar(),
  addressLine2: varchar(),
  city: varchar().notNull(),
  state: varchar(),
  pincode: numeric({ mode: "number" }),
  groupId: uuid(),
  transportId: uuid(),
})


// -----------------------------------------------------------PARTY & TRASNPORT RELATIONS-----------------------------------------------------------//

export const partyRelation = relations(parties, ({ one }) => ({
  transport: one(transports, {
    fields: [parties.transportId],
    references: [transports.id]
  }),
  group: one(groups, {
    fields: [parties.groupId],
    references: [groups.id]
  })
}))


export const partySchema = z.object({
  name: z.string().min(1, { message: "Party Name is required" }),
  gstin: z.string().nullable().optional(),
  contact: z.string(),
  email: z.string().email({ message: " Invalid Email" }).nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string(),
  state: z.string().nullable().optional(),
  pincode: z.coerce.number().min(100000, { message: "pincode must be of 6 digits" }).max(999999, { message: "pincode must be of 6 digits" }).nullable().optional(),
  groupId: z.string().nullable().optional(),
  transportId: z.string().nullable().optional(),
  // isActive: z.boolean().default(true),

})


export const partyUpdateSchema = partySchema.extend({
  id: z.string().uuid()
})

export type PartyUpdate = z.infer<typeof partyUpdateSchema>
export type Party = z.infer<typeof partySchema>
export type PartyRecord = PartyUpdate

import { relations } from "drizzle-orm"
import { numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core"
import { transports } from "./transport"
import { groups } from "./group"
// -------------------------------------------------------------------PARTY------------------------------------------------------------------------//

export const parties = pgTable("parties", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar(),
  gstin: varchar(),
  contact: numeric(),
  addressLine1: varchar(),
  addressLine2: varchar(),
  city: varchar(),
  state: varchar(),
  pincode: numeric({ mode: "number" }),
  groupId: uuid(),
  transportId: uuid(),
})

export type Party = typeof parties.$inferSelect
export type NewParty = typeof parties.$inferInsert

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
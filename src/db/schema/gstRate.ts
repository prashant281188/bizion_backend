// db/schema/gstRate.ts

import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { gstGroups } from "./gstGroup";

export const gstRates = pgTable("gst_rates", {
  id: uuid("id").defaultRandom().primaryKey(),

  gstGroupId: uuid("gst_group_id").references(() => gstGroups.id, { onDelete: "cascade" }).notNull(),
  cgst: numeric("cgst", { precision: 5, scale: 2 }).notNull(),
  sgst: numeric("sgst", { precision: 5, scale: 2 }).notNull(),
  igst: numeric("igst", { precision: 5, scale: 2 }).notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const gstRateRelations = relations(gstRates, ({ one }) => ({
  gstGroup: one(gstGroups, {
    fields: [gstRates.gstGroupId],
    references: [gstGroups.id],
  }),
}));
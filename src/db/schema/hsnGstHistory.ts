import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { hsnCodes } from "./hsnCodes";
import { gstGroups } from "./gstGroup";
import { relations } from "drizzle-orm";

export const hsnGstHistory = pgTable("hsn_gst_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    hsnId: uuid("hsn_id").references(() => hsnCodes.id, { onDelete: "cascade" }).notNull(),
    gstGroupId: uuid("gst_group_id").references(() => gstGroups.id, {onDelete: "restrict"}).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
},
    (table) => [
        index("hsn_gst_history_hsn_idx").on(table.hsnId),
        index("hsn_gst_histort_effective_idx").on(table.effectiveFrom, table.effectiveTo)
    ])

export const hsnGstHistoryRelations = relations(hsnGstHistory,
    ({ one }) => ({
        hsn: one(hsnCodes, {
            fields: [hsnGstHistory.hsnId],
            references: [hsnCodes.id]
        }),
        gstGroup: one(gstGroups, {
            fields: [hsnGstHistory.gstGroupId],
            references: [gstGroups.id]
        })
    })
)


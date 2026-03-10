import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { hsnCodes } from "./hsnCodes";
import { gstGroups } from "./gstGroup";
import { relations } from "drizzle-orm";

export const hsnGstHistory = pgTable("hsn_gst_history", {
    id: uuid("id").defaultRandom().primaryKey(),

    hsnId: uuid("hsn_id")
        .references(() => hsnCodes.id, { onDelete: "cascade" })
        .notNull(),

    gstGroupId: uuid("gst_group_id")
        .references(() => gstGroups.id)
        .notNull(),

    effectiveFrom: timestamp("effective_from"),
    effectiveTo: timestamp("effective_to"),

    createdAt: timestamp("created_at").defaultNow()
})

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


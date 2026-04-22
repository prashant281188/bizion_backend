import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { hsnGstHistory } from "./hsn";

// ─── GST Groups ───────────────────────────────────────────────────────────────

export const gstGroups = pgTable("gst_groups", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── GST Rates ────────────────────────────────────────────────────────────────

export const gstRates = pgTable("gst_rates", {
    id: uuid("id").defaultRandom().primaryKey(),
    gstGroupId: uuid("gst_group_id")
        .references(() => gstGroups.id, { onDelete: "cascade" })
        .notNull(),
    cgst: numeric("cgst", { precision: 5, scale: 2 }).notNull(),
    sgst: numeric("sgst", { precision: 5, scale: 2 }).notNull(),
    igst: numeric("igst", { precision: 5, scale: 2 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const gstGroupRelations = relations(gstGroups, ({ many }) => ({
    rates: many(gstRates),
    hsnMappings: many(hsnGstHistory),
}));

export const gstRateRelations = relations(gstRates, ({ one }) => ({
    gstGroup: one(gstGroups, {
        fields: [gstRates.gstGroupId],
        references: [gstGroups.id],
    }),
}));

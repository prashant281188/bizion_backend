import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { gstGroups } from "./gst";

// ─── HSN Codes ────────────────────────────────────────────────────────────────

export const hsnCodes = pgTable(
  "hsn_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hsnCode: varchar("hsn_code", { length: 10 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => [index("hsn_code_idx").on(table.hsnCode)]
);

// ─── HSN GST History ─────────────────────────────────────────────────────────

export const hsnGstHistory = pgTable(
  "hsn_gst_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hsnId: uuid("hsn_id")
      .references(() => hsnCodes.id, { onDelete: "cascade" })
      .notNull(),
    gstGroupId: uuid("gst_group_id")
      .references(() => gstGroups.id, { onDelete: "restrict" })
      .notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("hsn_gst_history_hsn_idx").on(table.hsnId),
    index("hsn_gst_historY_effective_idx").on(table.effectiveFrom, table.effectiveTo),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const hsnRelations = relations(hsnCodes, ({ many }) => ({
  gstHistory: many(hsnGstHistory),
}));

export const hsnGstHistoryRelations = relations(hsnGstHistory, ({ one }) => ({
  hsn: one(hsnCodes, {
    fields: [hsnGstHistory.hsnId],
    references: [hsnCodes.id],
  }),
  gstGroup: one(gstGroups, {
    fields: [hsnGstHistory.gstGroupId],
    references: [gstGroups.id],
  }),
}));

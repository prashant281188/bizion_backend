import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { variantOptionValues } from "./productVariant";

// ─── Options ──────────────────────────────────────────────────────────────────

export const options = pgTable("options", {
  id: uuid("id").defaultRandom().primaryKey(),
  optionName: text("option_name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Option Values ────────────────────────────────────────────────────────────

export const optionValues = pgTable(
  "option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    optionId: uuid("option_id")
      .notNull()
      .references(() => options.id, { onDelete: "cascade" }),
    optionValue: text("option_value").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("option_values_option_value_unique").on(table.optionId, table.optionValue),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const optionRelations = relations(options, ({ many }) => ({
  values: many(optionValues),
}));

export const optionValueRelations = relations(optionValues, ({ one, many }) => ({
  option: one(options, {
    fields: [optionValues.optionId],
    references: [options.id],
  }),
  variantValues: many(variantOptionValues),
}));

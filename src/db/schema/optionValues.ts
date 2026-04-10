import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { options } from "./options";
import { relations } from "drizzle-orm";
import { variantOptionValues } from "./variantOptionValues";

/**
 * Concrete values for a product option.
 * Example: Option "Size" → values "S", "M", "L", "XL".
 *
 * The unique constraint prevents inserting duplicate values within the same option
 * (e.g. two "Red" entries under the "Colour" option).
 */
export const optionValues = pgTable(
  "option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    optionId: uuid("option_id")
      .notNull()
      .references(() => options.id, { onDelete: "cascade" }),

    optionValue: text("option_value").notNull(),

    /** Controls display order within the option (e.g. S < M < L < XL) */
    position: integer("position").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    /** Prevent duplicate values under the same option (added — was missing) */
    uniqueIndex("option_values_option_value_unique").on(table.optionId, table.optionValue),
  ]
);

export const optionValueRelations = relations(optionValues, ({ one, many }) => ({
  option: one(options, {
    fields: [optionValues.optionId],
    references: [options.id],
  }),
  variantValues: many(variantOptionValues),
}));

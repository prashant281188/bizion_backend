import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";
import { optionValues } from "./optionValues";

/**
 * Junction table: which option values are applied to a given variant.
 * Example: variant row for "Red / XL" has two rows here —
 *   (variantId, optionValueId[Red]) and (variantId, optionValueId[XL]).
 *
 * Both columns are NOT NULL — a join record with no variant or no value is meaningless.
 * Cascade-deletes from both sides keep the table clean automatically.
 */
export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),

    /** Fixed: was nullable — an option-value link must reference a real option-value row */
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => optionValues.id, { onDelete: "cascade" }),
  },
  (table) => [
    /** Prevent the same option value being linked to the same variant twice */
    uniqueIndex("variant_option_values_unique").on(table.variantId, table.optionValueId),
    index("vov_variant_idx").on(table.variantId),
    index("vov_option_value_idx").on(table.optionValueId),
  ]
);

export const variantOptionValueRelations = relations(variantOptionValues, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantOptionValues.variantId],
    references: [productVariants.id],
  }),
  optionValue: one(optionValues, {
    fields: [variantOptionValues.optionValueId],
    references: [optionValues.id],
  }),
}));

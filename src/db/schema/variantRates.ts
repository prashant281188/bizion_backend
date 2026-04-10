import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";

/**
 * Pricing history for a variant.
 *
 * Design pattern — append-only price history:
 *   • INSERT a new row whenever prices change; set effectiveTo = now() on the
 *     previously active row before inserting.
 *   • The CURRENT active rate is the row where effectiveTo IS NULL.
 *   • Old rows (effectiveTo IS NOT NULL) are kept for audit / reporting.
 *
 * Migration note: columns were previously named "from" and "to" (SQL reserved words).
 * Run: ALTER TABLE variant_rates
 *        RENAME COLUMN "from" TO effective_from,
 *        RENAME COLUMN "to"   TO effective_to;
 */
export const variantRates = pgTable(
  "variant_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),

    mrp:          numeric("mrp",           { precision: 12, scale: 2 }),
    purchaseRate: numeric("purchase_rate",  { precision: 12, scale: 2 }),
    saleRate:     numeric("sale_rate",      { precision: 12, scale: 2 }),

    /** When this rate row became active (replaces the reserved-word column "from") */
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).defaultNow().notNull(),

    /**
     * When this rate row was superseded — NULL means currently active.
     * (Replaces the reserved-word column "to".)
     */
    effectiveTo: timestamp("effective_to", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("rates_variant_idx").on(table.variantId),
    /** Optimises the common "get current rate" query: WHERE variantId = ? AND effectiveTo IS NULL */
    index("rates_variant_effective_idx").on(table.variantId, table.effectiveFrom),
  ]
);

export const variantRatesRelations = relations(variantRates, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [variantRates.variantId],
    references: [productVariants.id],
  }),
}));

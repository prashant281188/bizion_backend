import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";

export const variantRates = pgTable(
  "variant_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    variantId: uuid("variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),

    mrp: numeric("mrp", { precision: 12, scale: 2 }),
    purchaseRate: numeric("purchase_rate", { precision: 12, scale: 2 }),
    saleRate: numeric("sale_rate", { precision: 12, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    from: timestamp("from"),
    to: timestamp("to")
  },
  (table) => [
    index("rates_variant_idx").on(table.variantId),
  ]
);

export const variantRatesRelations = relations(variantRates, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [variantRates.variantId],
    references: [productVariants.id]
  })
}))

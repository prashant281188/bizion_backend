import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";

export const productRates = pgTable(
  "product_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    variantId: uuid("variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),

    mrp: numeric("mrp", { precision: 12, scale: 2 }),
    purchaseRate: numeric("purchase_rate", { precision: 12, scale: 2 }),
    saleRate: numeric("sale_rate", { precision: 12, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("rates_variant_idx").on(table.variantId),
  ]
);

export const productRatesRelations = relations(productRates, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [productRates.variantId],
    references: [productVariants.id]
  })
}))

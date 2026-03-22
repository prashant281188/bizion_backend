import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { products } from "./product";
import { relations } from "drizzle-orm";
import { productRates } from "./variantRates";
import { variantOptionValues } from "./variantOptionValues";
import { variantImages } from "./variantImage";

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    sku: text("sku").unique(),
    barcode: text("barcode"),

    packing: integer("packing"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("variants_sku_unique").on(table.sku),
    index("variants_product_idx").on(table.productId),
  ])

export const productVariantRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, ({
    fields: [productVariants.productId],
    references: [products.id]
  })),
  optionValues: many(variantOptionValues),
  rates: many(productRates),
  images: many(variantImages)
}))
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { products } from "./product";
import { relations } from "drizzle-orm";
import { variantRates } from "./variantRates";
import { variantOptionValues } from "./variantOptionValues";
import { variantImages } from "./variantImage";

/**
 * A specific variation of a product (e.g. 500 ml, Red / XL).
 * Each variant carries its own SKU, barcode, packing size, pricing history,
 * option-value links and media gallery.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /** Owning product — cascade-deletes all variants when the product is removed */
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    /**
     * Stock-keeping unit; nullable so a variant can exist before a SKU is assigned.
     * Unique per product — Postgres treats each NULL as distinct, so
     * multiple SKU-less variants for the same product are allowed.
     */
    sku: text("sku"),

    /**
     * Barcode (EAN-13 / UPC-A / QR etc.); nullable, unique per product when set.
     * Again, multiple null barcodes per product are fine (Postgres NULL semantics).
     */
    barcode: text("barcode"),

    /** Packing quantity with up to 2 decimal places (e.g. 500.00 ml, 1.50 kg) */
    packing: numeric("packing", { precision: 10, scale: 2 }),

    isActive: boolean("is_active").default(true).notNull(),

    /** Soft-delete flag — was incorrectly defaulted to TRUE (bug fix: now FALSE) */
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("variants_sku_product_unique").on(table.sku, table.productId),
    uniqueIndex("variants_barcode_product_unique").on(table.barcode, table.productId),
    index("variants_product_idx").on(table.productId),
    index("variants_deleted_idx").on(table.isDeleted),
  ]
);

export const productVariantRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  optionValues: many(variantOptionValues),
  rates: many(variantRates),
  images: many(variantImages),
}));

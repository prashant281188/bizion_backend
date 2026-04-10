import { pgTable, text, uuid, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { products } from "./product";
import { relations } from "drizzle-orm";

/**
 * Stores the cover / hero image for a product.
 *
 * Circular-FK handling:
 *   products.imageId → productImages.id   (which image is the current cover)
 *   productImages.productId → products.id  (which product owns this image row)
 *
 * Because both FKs are nullable, the safe insert order is:
 *   1. INSERT product  (imageId = NULL)
 *   2. INSERT productImage  (productId = product.id)
 *   3. UPDATE product SET imageId = productImage.id
 *
 * The S3 key stored in `path` is resolved to a full URL by resolveImageUrl().
 */
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /** Back-reference: which product owns this image (nullable for insert-order safety) */
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),

    /** S3 object key — use resolveImageUrl() to get the full URL */
    path: text("path").notNull(),

    alt: text("alt"),

    /** Display order when a product has multiple images */
    position: integer("position").default(0).notNull(),

    /** TRUE for the image that is the product's current cover / hero shot */
    isPrimary: boolean("is_primary").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("product_images_product_idx").on(table.productId),
  ]
);

/** Relations — was missing entirely; required for Drizzle relational queries */
export const productImageRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

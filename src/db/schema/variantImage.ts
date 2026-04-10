import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";

/**
 * Media gallery for a specific product variant.
 * Stores S3 object keys; resolve to full URLs via resolveImageUrl().
 * Cascade-deletes when the parent variant is hard-deleted.
 */
export const variantImages = pgTable(
  "variant_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /**
     * Parent variant — was previously defined with a duplicate .references() call
     * (once without onDelete, once with cascade). Fixed: single reference with cascade.
     */
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),

    /** S3 object key — resolve to full URL via resolveImageUrl() */
    path: text("path").notNull(),
    alt: text("alt"),

    /** Display order within the variant gallery; lower = shown first */
    position: integer("position").default(0).notNull(),

    /** Marks the thumbnail / hero image for this variant */
    isPrimary: boolean("is_primary").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("variant_images_variant_idx").on(table.productVariantId),
  ]
);

export const variantImageRelations = relations(variantImages, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantImages.productVariantId],
    references: [productVariants.id],
  }),
}));

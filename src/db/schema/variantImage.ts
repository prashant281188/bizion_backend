import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { productVariants } from "./productVariant";
import { relations } from "drizzle-orm";

export const variantImages = pgTable("variant_images", {
    id: uuid("id").defaultRandom().primaryKey(),
    productVariantId: uuid("product_variant_id")
        .references(() => productVariants.id),

    path: text("path").notNull(),
    // S3 path

    alt: text("alt"),

    position: integer("position").default(0),

    isPrimary: boolean("is_primary").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const variantImageRelations = relations(variantImages, ({ one }) => ({
    variant: one(productVariants, {
        fields: [variantImages.productVariantId],
        references: [productVariants.id]
    })
}))
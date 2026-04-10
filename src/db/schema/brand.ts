import { relations } from "drizzle-orm";
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./product";

/**
 * Product brands (manufacturers / labels).
 * Both brandName and slug are unique across the system.
 * brandLogo stores an S3 object key — resolve via resolveImageUrl().
 */
export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    brandName: text("brand_name").notNull().unique(),

    /** URL-friendly identifier — fixed: was indexed but NOT unique (could create duplicate slugs) */
    slug: text("slug").notNull(),

    /** S3 object key for the brand logo — resolve via resolveImageUrl() */
    brandLogo: text("brand_logo"),

    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("brands_slug_unique").on(table.slug),
    index("brands_active_idx").on(table.isActive),
  ]
);

export const brandRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

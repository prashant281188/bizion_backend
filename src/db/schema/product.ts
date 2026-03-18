import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { categories } from "./category";
import { relations } from "drizzle-orm";
import { productVariants } from "./productVariant";
import { brands } from "./brand";
import { hsnCodes } from "./hsnCodes";
import { units } from "./unit";
import { productImages } from "./productImage";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    model: text("model").notNull(),
    metal: text("metal"),
    description: text("description"),
    slug: text("slug"),

    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "no action" }),

    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "restrict" })
      .notNull(),

    hsnId: uuid("hsn_id")
      .references(() => hsnCodes.id, { onDelete: "set null" }),

    unitId: uuid("unit_id")
      .references(() => units.id),

    sizeType: text("size_type").default("mm"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug, table.model, table.brandId),
    index("products_model_idx").on(table.model),
    index("products_category_idx").on(table.categoryId),
  ])

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  hsn: one(hsnCodes, {
    fields: [products.hsnId],
    references: [hsnCodes.id]
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id]
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id]
  }),
  variants: many(productVariants),
  images: many(productImages)

}));

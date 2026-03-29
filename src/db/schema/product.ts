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
    shortDescription: text("short_description"),
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

    imageId: uuid("image_id")
      .references(() => productImages.id),

    sizeType: text("size_type"),

    isActive: boolean("is_active").default(true).notNull(),
    inStock :boolean("in_stock").default(false),


    isFeatured: boolean("is_featured").default(false),
    isNew: boolean("is_new").default(false),

    status: text("status").default('draft'), // draft, active, archived

    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_brand_model_unique").on(table.brandId, table.model),
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
  image: one(productImages, {
    fields: [products.imageId],
    references: [productImages.id]
  }),
  variants: many(productVariants),

}));

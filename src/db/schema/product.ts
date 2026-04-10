import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
  uniqueIndex,
  pgEnum,
  PgColumn,
} from "drizzle-orm/pg-core";
import { categories } from "./category";
import { relations } from "drizzle-orm";
import { productVariants } from "./productVariant";
import { brands } from "./brand";
import { hsnCodes } from "./hsnCodes";
import { units } from "./unit";
import { productImages } from "./productImage";

export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    model: text("model").notNull(),
    metal: text("metal"),          // enum, not free text
    slug: text("slug").notNull(),  // notNull + unique
    shortDescription: text("short_description"),
    description: text("description"),


    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }), // not "no action"
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }).notNull(),
    hsnId: uuid("hsn_id").references(() => hsnCodes.id, { onDelete: "set null" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    imageId: uuid("image_id").references((): PgColumn => productImages.id, { onDelete: "set null" }),

    sizeType: text("size_type"),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isNew: boolean("is_new").default(false).notNull(),
    status: productStatusEnum("status").default("draft").notNull(),  // enum

    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_brand_model_unique").on(table.brandId, table.model),
    index("products_model_idx").on(table.model),
    index("products_slug_idx").on(table.slug),
    index("products_category_idx").on(table.categoryId),
    index("products_status_deleted_idx").on(table.status, table.isDeleted), // compound — most common filter
    index("products_brand_idx").on(table.brandId),
    index("products_featured_idx").on(table.isFeatured),
  ]);

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

import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  AnyPgColumn,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./product";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryName: text("category_name").notNull().unique(),
    slug: text("slug").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
    description: text("description"),
    categoryImage: text("category_image"),   // S3 key
    order: integer("order").default(0).notNull(),  // display order within parent
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }, (table) => [
    index("categories_parent_idx").on(table.parentId),   // MISSING — tree queries
    index("categories_slug_idx").on(table.slug),
    index("categories_order_idx").on(table.order),
  ]);


export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parentCategory: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  })
}));

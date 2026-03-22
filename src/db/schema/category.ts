import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { products } from "./product";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    categoryName: text("category_name").notNull().unique(),
    parentId: uuid("parent_id").references(():any => categories.id),
    description: text("description"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parentCategory: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  })
}));

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { categories } from "./category";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    model: text("model").notNull(),
    brand: text("brand"),
    metal: text("metal"),
    description: text("description"),

    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "restrict" })
      .notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_model_idx").on(table.model),
    index("products_category_idx").on(table.categoryId),
  ]
);

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./product";

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),

    size: text("size"),
    finish: text("finish"),
    packing: integer("packing"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("variants_product_idx").on(table.productId),
  ]
);

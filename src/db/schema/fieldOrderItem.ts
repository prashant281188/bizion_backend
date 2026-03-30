import { pgTable, uuid, text, integer, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { fieldOrders } from "./fieldOrder";
import { products } from "./product";
import { productVariants } from "./productVariant";

export const fieldOrderItems = pgTable(
  "field_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => fieldOrders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Stored at order time in case product data changes later
    productName: text("product_name").notNull(),
    finish: text("finish"),
    size: text("size"),
    boxQty: integer("box_qty").notNull(),
    ratePerBox: numeric("rate_per_box", { precision: 10, scale: 2 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("field_order_items_order_idx").on(table.orderId)]
);

export const fieldOrderItemRelations = relations(fieldOrderItems, ({ one }) => ({
  order: one(fieldOrders, {
    fields: [fieldOrderItems.orderId],
    references: [fieldOrders.id],
  }),
  product: one(products, {
    fields: [fieldOrderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [fieldOrderItems.variantId],
    references: [productVariants.id],
  }),
}));

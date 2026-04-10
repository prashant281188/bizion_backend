import { pgTable, uuid, text, integer, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./order";
import { products } from "./product";
import { productVariants } from "./productVariant";
import { dispatchAllocations } from "./dispatchAllocation";
import { purchaseReceiptAllocations } from "./purchaseReceipt";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),

    // Stored at order time in case product data changes later
    sku: text("sku").notNull(),
    boxQty: integer("box_qty").notNull(),
    packing: numeric("packing", { precision: 10, scale: 2 }).notNull(),

    orderQty: numeric("order_qty", { precision: 12, scale: 2 }),
    fulfilledQty: numeric("fulfilled_qty", { mode: "number", precision: 12, scale: 2 }).default(0),
    cancelledQty: numeric("cancelled_qty", { mode: "number", precision: 12, scale: 2 }).default(0),


    mrp: numeric("mrp", { precision: 12, scale: 2 }), // for printing on invoice
    discount: numeric("discount", { precision: 5, scale: 2 }).default("0"), // % applied
    
    rate: numeric("rate", { precision: 12, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }), // GST % at time of order
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }), // per line item

    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("field_order_items_order_idx").on(table.orderId)]
);

export const fieldOrderItemRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  dispatchAllocations: many(dispatchAllocations),
  purchaseReceiptAllocations: many(purchaseReceiptAllocations),
}));

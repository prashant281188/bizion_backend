import { numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./order";
import { users } from "./user";
import { productVariants } from "./productVariant";
import { orderItems } from "./orderItem";

export const purchaseReceipts = pgTable("puchase_receipts", {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id),
    receivedDate: timestamp("received_date"),
    createdBy: uuid("created_by").references(() => users.id),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
}
)

export const purchaseReceiptItems = pgTable("purchase_receipt_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    receipt_id: uuid("receipt_id").references(() => purchaseReceipts.id),
    variant_id: uuid("variant_id").references(() => productVariants.id),
    orderId: uuid("order_id").references(() => orders.id),
    totalQty: numeric("total_qty", { mode: "number", precision: 12, scale: 2 }),

})
export const purchaseReceiptAllocations = pgTable("purchase_receipt_allocations", {
    id: uuid("id").defaultRandom().primaryKey(),
    receiptItemId: uuid("receipt_item_id").references(() => purchaseReceiptItems.id),
    orderItemId: uuid("order_item_id").references(() => orderItems.id),
    allocatedQty: numeric("allocated_qty", { mode: "number", precision: 12, scale: 2 })
})

export const purchaseReceiptRelations = relations(purchaseReceipts, ({ one, many }) => ({
    order: one(orders, {
        fields: [purchaseReceipts.orderId],
        references: [orders.id],
    }),
    createdByUser: one(users, {
        fields: [purchaseReceipts.createdBy],
        references: [users.id],
    }),
    items: many(purchaseReceiptItems),
}));

export const purchaseReceiptItemRelations = relations(purchaseReceiptItems, ({ one, many }) => ({
    receipt: one(purchaseReceipts, {
        fields: [purchaseReceiptItems.receipt_id],
        references: [purchaseReceipts.id],
    }),
    variant: one(productVariants, {
        fields: [purchaseReceiptItems.variant_id],
        references: [productVariants.id],
    }),
    order: one(orders, {
        fields: [purchaseReceiptItems.orderId],
        references: [orders.id],
    }),
    allocations: many(purchaseReceiptAllocations),
}));

export const purchaseReceiptAllocationRelations = relations(purchaseReceiptAllocations, ({ one }) => ({
    receiptItem: one(purchaseReceiptItems, {
        fields: [purchaseReceiptAllocations.receiptItemId],
        references: [purchaseReceiptItems.id],
    }),
    orderItem: one(orderItems, {
        fields: [purchaseReceiptAllocations.orderItemId],
        references: [orderItems.id],
    }),
}));
import { index, numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { dispatchItems } from "./dispatchItems";
import { orderItems } from "./orderItem";

// Bridge: which order line is fulfilled by which dispatch item, and how much
export const dispatchAllocations = pgTable("dispatch_allocations", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchItemId: uuid("dispatch_item_id").notNull().references(() => dispatchItems.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
    allocatedQty: numeric("allocated_qty", { mode: "number", precision: 12, scale: 2 }).notNull(),
},
    (table) => [
        index("dispatch_alloc_dispatch_item_idx").on(table.dispatchItemId),
        index("dispatch_alloc_order_item_idx").on(table.orderItemId),
    ]
)

export const dispatchAllocationRelations = relations(dispatchAllocations, ({ one }) => ({
    dispatchItem: one(dispatchItems, {
        fields: [dispatchAllocations.dispatchItemId],
        references: [dispatchItems.id],
    }),
    orderItem: one(orderItems, {
        fields: [dispatchAllocations.orderItemId],
        references: [orderItems.id],
    }),
}));

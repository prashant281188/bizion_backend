import { numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { dispatchItems } from "./dispatchItems";
import { orderItems } from "./orderItem";

export const dispatchAllocations = pgTable("dispact_allocations", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchItemId: uuid("dispatch_item_id").references(() => dispatchItems.id),
    orderItemsId: uuid("order_item_id").references(() => orderItems.id),
    allocatedQty: numeric("allocated_qty", { mode: "number", precision: 12, scale: 2 }),
})

export const dispatchAllocationRelations = relations(dispatchAllocations, ({ one }) => ({
    dispatchItem: one(dispatchItems, {
        fields: [dispatchAllocations.dispatchItemId],
        references: [dispatchItems.id],
    }),
    orderItem: one(orderItems, {
        fields: [dispatchAllocations.orderItemsId],
        references: [orderItems.id],
    }),
}));
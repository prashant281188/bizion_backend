import { numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { dispatches } from "./dispatch";
import { orderItems } from "./orderItem";
import { productVariants } from "./productVariant";
import { dispatchAllocations } from "./dispatchAllocation";

export const dispatchItems = pgTable("dispatch_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchId: uuid("dispatch_id").references(() => dispatches.id),
    orderItemId: uuid("ordet_item_id").references(() => orderItems.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    totalQty: numeric("total_qty", { mode: "number", precision: 12, scale: 2 })
})

export const dispatchItemRelations = relations(dispatchItems, ({ one, many }) => ({
    dispatch: one(dispatches, {
        fields: [dispatchItems.dispatchId],
        references: [dispatches.id],
    }),
    orderItem: one(orderItems, {
        fields: [dispatchItems.orderItemId],
        references: [orderItems.id],
    }),
    variant: one(productVariants, {
        fields: [dispatchItems.variantId],
        references: [productVariants.id],
    }),
    allocations: many(dispatchAllocations),
}));